use rand::Rng;
use serde::{Deserialize, Serialize};
use std::io::Read;
use std::sync::{Mutex, OnceLock};
use std::thread;
use tauri::{AppHandle, Emitter};
use tiny_http::{Header, Method, Request, Response, Server, StatusCode};

const PORT: u16 = 8765;
const CODE_CHARS: &[u8] = b"23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

static HANDOFF_TOKEN: OnceLock<Mutex<String>> = OnceLock::new();
static CROWD_BASE: OnceLock<Mutex<String>> = OnceLock::new();
static SERVER_STARTED: OnceLock<Mutex<bool>> = OnceLock::new();

fn token_store() -> &'static Mutex<String> {
    HANDOFF_TOKEN.get_or_init(|| Mutex::new(generate_token()))
}

fn crowd_base_store() -> &'static Mutex<String> {
    CROWD_BASE.get_or_init(|| Mutex::new("http://localhost:5173".to_string()))
}

fn server_flag() -> &'static Mutex<bool> {
    SERVER_STARTED.get_or_init(|| Mutex::new(false))
}

fn generate_token() -> String {
    let mut rng = rand::thread_rng();
    (0..8)
        .map(|_| {
            let idx = rng.gen_range(0..CODE_CHARS.len());
            CODE_CHARS[idx] as char
        })
        .collect()
}

fn generate_session_code() -> String {
    let mut rng = rand::thread_rng();
    (0..6)
        .map(|_| {
            let idx = rng.gen_range(0..CODE_CHARS.len());
            CODE_CHARS[idx] as char
        })
        .collect()
}

fn new_uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}

pub fn local_ip() -> Option<String> {
    local_ip_address::local_ip().ok().map(|ip| ip.to_string())
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LanPairingInfo {
    pub ip: Option<String>,
    pub port: u16,
    pub token: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LanGigHandoff {
    pub session_id: String,
    pub code: String,
    pub dj_token: String,
    pub name: String,
    pub display_name: String,
    pub crowd_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub crowd_profile_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub library_source: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_pending_requests: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_requests_per_guest: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub local_only: Option<bool>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct StartGigBody {
    display_name: String,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    library_source: Option<String>,
    #[serde(default)]
    crowd_profile_url: Option<String>,
    #[serde(default)]
    max_pending_requests: Option<u32>,
    #[serde(default)]
    max_requests_per_guest: Option<u32>,
}

fn cors_headers() -> Vec<Header> {
    vec![
        Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap(),
        Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"GET, POST, OPTIONS"[..]).unwrap(),
        Header::from_bytes(
            &b"Access-Control-Allow-Headers"[..],
            &b"Content-Type, X-Q-Handoff-Token"[..],
        )
        .unwrap(),
    ]
}

fn json_response(status: StatusCode, body: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    let mut headers = cors_headers();
    headers.push(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap());
    Response::new(status, headers, std::io::Cursor::new(body.as_bytes().to_vec()), None, None)
}

fn read_token(req: &Request) -> Option<String> {
    req.headers()
        .iter()
        .find(|h| h.field.equiv("X-Q-Handoff-Token"))
        .map(|h| h.value.as_str().to_string())
}

fn authorized(req: &Request) -> bool {
    let expected = token_store().lock().ok().map(|t| t.clone()).unwrap_or_default();
    read_token(req).is_some_and(|t| t == expected)
}

fn emit_handoff(app: &AppHandle, payload: LanGigHandoff) {
    let _ = app.emit("gig-handoff", payload);
}

fn build_local_gig(body: &StartGigBody) -> LanGigHandoff {
    let crowd_base = crowd_base_store()
        .lock()
        .ok()
        .map(|s| s.trim_end_matches('/').to_string())
        .unwrap_or_else(|| "http://localhost:5173".to_string());
    let code = generate_session_code();
    let name = body
        .name
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("Tonight")
        .to_string();
    let display_name = body.display_name.trim();
    let display_name = if display_name.is_empty() {
        name.clone()
    } else {
        display_name.to_string()
    };
    LanGigHandoff {
        session_id: new_uuid(),
        code: code.clone(),
        dj_token: new_uuid(),
        name,
        display_name,
        crowd_url: format!("{crowd_base}/r/{code}"),
        crowd_profile_url: body.crowd_profile_url.clone(),
        library_source: body.library_source.clone(),
        max_pending_requests: body.max_pending_requests,
        max_requests_per_guest: body.max_requests_per_guest,
        local_only: Some(true),
    }
}

fn handle_request(app: AppHandle, mut req: Request) {
    let method = req.method().clone();
    let url = req.url().to_string();
    let path = url.split('?').next().unwrap_or(&url);

    if method == Method::Options {
        let _ = req.respond(json_response(StatusCode(204), ""));
        return;
    }

    if method == Method::Get && path == "/health" {
        let body = r#"{"ok":true,"service":"q-desktop-lan"}"#;
        let _ = req.respond(json_response(StatusCode(200), body));
        return;
    }

    if method == Method::Get && path == "/local/pairing" {
        let info = pairing_info();
        let body = serde_json::to_string(&info).unwrap_or_else(|_| "{}".to_string());
        let _ = req.respond(json_response(StatusCode(200), &body));
        return;
    }

    if method == Method::Post && path == "/local/handoff" {
        if !authorized(&req) {
            let _ = req.respond(json_response(StatusCode(401), r#"{"error":"Invalid token"}"#));
            return;
        }
        let mut body = String::new();
        if req.as_reader().read_to_string(&mut body).is_err() {
            let _ = req.respond(json_response(StatusCode(400), r#"{"error":"Bad body"}"#));
            return;
        }
        match serde_json::from_str::<LanGigHandoff>(&body) {
            Ok(payload) => {
                emit_handoff(&app, payload.clone());
                let _ = req.respond(json_response(StatusCode(200), r#"{"ok":true}"#));
            }
            Err(_) => {
                let _ = req.respond(json_response(StatusCode(400), r#"{"error":"Invalid JSON"}"#));
            }
        }
        return;
    }

    if method == Method::Post && path == "/local/start-gig" {
        if !authorized(&req) {
            let _ = req.respond(json_response(StatusCode(401), r#"{"error":"Invalid token"}"#));
            return;
        }
        let mut body = String::new();
        if req.as_reader().read_to_string(&mut body).is_err() {
            let _ = req.respond(json_response(StatusCode(400), r#"{"error":"Bad body"}"#));
            return;
        }
        match serde_json::from_str::<StartGigBody>(&body) {
            Ok(start) => {
                let payload = build_local_gig(&start);
                emit_handoff(&app, payload.clone());
                let json = serde_json::to_string(&payload).unwrap_or_else(|_| "{}".to_string());
                let _ = req.respond(json_response(StatusCode(200), &json));
            }
            Err(_) => {
                let _ = req.respond(json_response(StatusCode(400), r#"{"error":"Invalid JSON"}"#));
            }
        }
        return;
    }

    let _ = req.respond(json_response(StatusCode(404), r#"{"error":"Not found"}"#));
}

pub fn pairing_info() -> LanPairingInfo {
    let token = token_store()
        .lock()
        .ok()
        .map(|t| t.clone())
        .unwrap_or_else(generate_token);
    LanPairingInfo {
        ip: local_ip(),
        port: PORT,
        token,
    }
}

pub fn ensure_server(app: AppHandle) {
    let mut started = server_flag().lock().unwrap();
    if *started {
        return;
    }
    *started = true;
    drop(started);

    thread::spawn(move || {
        let addr = format!("0.0.0.0:{PORT}");
        let server = match Server::http(&addr) {
            Ok(s) => s,
            Err(_) => return,
        };
        for request in server.incoming_requests() {
            handle_request(app.clone(), request);
        }
    });
}

#[tauri::command]
pub fn start_lan_handoff(app: AppHandle, crowd_base_url: String) -> Result<LanPairingInfo, String> {
    if let Ok(mut base) = crowd_base_store().lock() {
        *base = crowd_base_url.trim_end_matches('/').to_string();
    }
    if let Ok(mut token) = token_store().lock() {
        if token.is_empty() {
            *token = generate_token();
        }
    }
    ensure_server(app);
    Ok(pairing_info())
}

#[tauri::command]
pub fn get_lan_pairing_info() -> LanPairingInfo {
    pairing_info()
}
