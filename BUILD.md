# Otk-Pomo v1.0.0 빌드 및 배포 가이드

## 빌드 방법

### 1. 프로덕션 빌드
```bash
npm run tauri build
```

이 명령어는:
- React 앱을 프로덕션 모드로 빌드
- Rust 백엔드를 최적화하여 컴파일
- 실행 파일과 설치 파일을 생성

### 2. 빌드 결과물 위치

빌드가 완료되면 다음 위치에 파일이 생성됩니다:

**Windows:**
- 실행 파일(exe): `src-tauri/target/release/otk-pomo.exe`
- 설치 프로그램(msi): `src-tauri/target/release/bundle/msi/Otk-Pomo_1.0.0_x64_en-US.msi`
- NSIS 설치 파일: `src-tauri/target/release/bundle/nsis/Otk-Pomo_1.0.0_x64-setup.exe`

**macOS:**
- 앱 번들: `src-tauri/target/release/bundle/macos/Otk-Pomo.app`
- DMG 파일: `src-tauri/target/release/bundle/dmg/Otk-Pomo_1.0.0_x64.dmg`

**Linux:**
- AppImage: `src-tauri/target/release/bundle/appimage/otk-pomo_1.0.0_amd64.AppImage`
- Deb 패키지: `src-tauri/target/release/bundle/deb/otk-pomo_1.0.0_amd64.deb`

## 배포 방법

### GitHub Release로 배포

1. **GitHub 저장소 생성**
   - GitHub에서 새 저장소 생성
   - 프로젝트를 GitHub에 푸시

2. **릴리즈 생성**
   ```bash
   git add .
   git commit -m "Release v1.0.0"
   git tag v1.0.0
   git push origin main
   git push origin v1.0.0
   ```

3. **GitHub에서 Release 생성**
   - GitHub 저장소의 "Releases" 탭으로 이동
   - "Create a new release" 클릭
   - Tag: `v1.0.0` 선택
   - Release title: `Otk-Pomo v1.0.0`
   - 빌드된 설치 파일들을 업로드
   - Release notes 작성
   - "Publish release" 클릭

### 로컬 배포 (간단한 방법)

빌드된 설치 파일을 직접 공유:
- Windows: `.msi` 또는 `-setup.exe` 파일 공유
- macOS: `.dmg` 파일 공유
- Linux: `.AppImage` 또는 `.deb` 파일 공유

## 자동 업데이트 설정 (선택사항)

자동 업데이트를 원하면:

1. `tauri.conf.json`에 updater 설정 추가
2. GitHub Releases를 업데이트 서버로 사용
3. 서명 키 생성 및 설정

자세한 내용은 [Tauri 공식 문서](https://tauri.app/v1/guides/distribution/updater)를 참조하세요.

## 개발 모드 실행

```bash
npm run tauri dev
```

## 트러블슈팅

### 빌드 실패 시
1. 의존성 재설치: `npm install`
2. 캐시 삭제: `npm run tauri build -- --clean`
3. Node 버전 확인: Node.js 18 이상 권장
4. Rust 버전 확인: `rustc --version`

### 아이콘이 제대로 표시되지 않는 경우
`src-tauri/icons/` 폴더의 아이콘 파일들이 올바른지 확인하세요.

## 버전 업데이트

다음 버전을 배포할 때:
1. `package.json`의 version 수정
2. `src-tauri/tauri.conf.json`의 version 수정
3. `src-tauri/Cargo.toml`의 version 수정
4. 빌드 및 배포

## 참고 자료

- [Tauri 공식 문서](https://tauri.app/)
- [Tauri 배포 가이드](https://tauri.app/v1/guides/building/)
