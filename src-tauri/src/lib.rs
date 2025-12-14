use font_kit::source::SystemSource;
use std::collections::HashSet;
use tauri::{Emitter, Manager};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_system_fonts() -> Result<Vec<String>, String> {
    let source = SystemSource::new();
    let mut font_names = HashSet::new();

    // 시스템의 모든 폰트 패밀리 이름 가져오기
    for family_name in source.all_families().map_err(|e| e.to_string())? {
        font_names.insert(family_name);
    }

    // HashSet을 Vec로 변환하고 정렬
    let mut fonts: Vec<String> = font_names.into_iter().collect();
    fonts.sort();

    Ok(fonts)
}

#[tauri::command]
async fn open_settings_window(app: tauri::AppHandle, always_on_top: bool) -> Result<(), String> {
    println!("Opening settings window with always_on_top: {}", always_on_top);

    // 미리 생성된 설정 창 가져오기
    if let Some(window) = app.get_webview_window("settings") {
        println!("Settings window found, setting always_on_top and showing...");
        window.set_always_on_top(always_on_top).map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;

        // 커스텀 이벤트 발생: 설정 창이 보여짐
        window.emit("settings-window-shown", ()).map_err(|e| e.to_string())?;

        println!("Settings window shown and focused");
        return Ok(());
    }

    println!("Settings window not found");
    Err("Settings window not found".to_string())
}

#[tauri::command]
async fn open_messages_window(app: tauri::AppHandle, always_on_top: bool) -> Result<(), String> {
    println!("Opening messages window with always_on_top: {}", always_on_top);

    // 미리 생성된 메시지 창 가져오기
    if let Some(window) = app.get_webview_window("messages") {
        println!("Messages window found, setting always_on_top and showing...");
        window.set_always_on_top(always_on_top).map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;

        // 커스텀 이벤트 발생: 메시지 창이 보여짐
        window.emit("messages-window-shown", ()).map_err(|e| e.to_string())?;

        println!("Messages window shown and focused");
        return Ok(());
    }

    println!("Messages window not found");
    Err("Messages window not found".to_string())
}

#[tauri::command]
async fn set_always_on_top(app: tauri::AppHandle, always_on_top: bool) -> Result<(), String> {
    println!("Setting always on top to: {}", always_on_top);

    // 메인 창
    if let Some(window) = app.get_webview_window("main") {
        window.set_always_on_top(always_on_top).map_err(|e| e.to_string())?;
        println!("Main window always_on_top set to: {}", always_on_top);
    }

    // 설정 창
    if let Some(window) = app.get_webview_window("settings") {
        window.set_always_on_top(always_on_top).map_err(|e| e.to_string())?;
        println!("Settings window always_on_top set to: {}", always_on_top);
    }

    // 메시지 창
    if let Some(window) = app.get_webview_window("messages") {
        window.set_always_on_top(always_on_top).map_err(|e| e.to_string())?;
        println!("Messages window always_on_top set to: {}", always_on_top);
    }

    Ok(())
}

#[tauri::command]
async fn close_child_windows(app: tauri::AppHandle) -> Result<(), String> {
    println!("Closing child windows");

    // 설정 창 닫기
    if let Some(window) = app.get_webview_window("settings") {
        if window.is_visible().unwrap_or(false) {
            window.close().map_err(|e| e.to_string())?;
            println!("Settings window closed");
        }
    }

    // 메시지 창 닫기
    if let Some(window) = app.get_webview_window("messages") {
        if window.is_visible().unwrap_or(false) {
            window.close().map_err(|e| e.to_string())?;
            println!("Messages window closed");
        }
    }

    Ok(())
}

#[tauri::command]
async fn quit_app(app: tauri::AppHandle) -> Result<(), String> {
    println!("Quitting app");

    // 자식 창들 먼저 닫기
    if let Some(window) = app.get_webview_window("settings") {
        let _ = window.close();
    }
    if let Some(window) = app.get_webview_window("messages") {
        let _ = window.close();
    }

    // 메인 창 닫기
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.close();
    }

    // 짧은 딜레이 후 앱 종료
    std::thread::sleep(std::time::Duration::from_millis(100));
    app.exit(0);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // 설정 창과 메시지 창이 이미 존재하는지 확인
            // tauri.conf.json에 정의되어 있으면 자동 생성됨
            println!("Checking for windows...");
            if let Some(_) = app.get_webview_window("settings") {
                println!("Settings window found");
            } else {
                println!("Settings window not found");
            }
            if let Some(_) = app.get_webview_window("messages") {
                println!("Messages window found");
            } else {
                println!("Messages window not found");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            open_settings_window,
            open_messages_window,
            get_system_fonts,
            set_always_on_top,
            close_child_windows,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
