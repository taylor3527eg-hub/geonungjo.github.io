# Portfolio

포트폴리오 홈페이지의 시작 파일은 index.html입니다.
흰 배경의 메인 화면, Engineering & Music, About & Vision, 연락처 푸터로 구성했습니다.
Robotic Stompbox는 첫 화면에 직접 통합되어 있습니다.

## 실행

1. VS Code에서 바탕화면의 portfolio 폴더를 엽니다.
2. 루트 index.html을 우클릭하고 Open with Live Server를 선택합니다.
3. 브라우저에서 슬라이더, 커서 외력, 페달 LED와 음표를 확인합니다.

JavaScript 모듈을 사용하므로 HTML 더블클릭 대신 Live Server로 실행하세요.

## 구조

- index.html: 홈페이지 구조와 기능이 들어가는 위치
- style.css: 홈페이지 공통 스타일
- script.js: 홈페이지에서 사용하는 기능 초기화
- assets/: 홈페이지 공용 이미지 등을 둘 공간
- features/robotic-stompbox/script.js: 로봇 동역학과 인터랙션 모듈
- features/robotic-stompbox/style.css: 로봇 영역에만 적용되는 스타일
- features/robotic-stompbox/assets/: 로봇 기능 전용 원본 이미지

## 기능 연결

홈페이지 script.js에서 initRoboticStompbox에 해당 영역을 전달합니다.
iframe 없이 동일한 문서 안에서 동작합니다.
이미지는 모듈 파일을 기준으로 불러오고, 입력과 스타일은 기능 영역으로 범위를 제한합니다.
나중에 다른 영역에 배치할 때는 index.html의 data-robotic-stompbox 섹션을 옮기면 됩니다.
기능을 동적으로 제거할 때는 초기화 함수가 반환하는 destroy()를 호출할 수 있습니다.

현재의 화면 배치, 물리 파라미터, 페달 ON/OFF, 빨간 LED와 음표 설정은 유지했습니다.
게시 작업은 아직 하지 않았습니다.

바탕화면의 기존 robotic-stompbox 폴더는 원본 보관용으로 남겨 두었습니다. 이후 수정과 실행은 portfolio 폴더에서 진행하세요.

## 홈페이지 구성

- 상단 메뉴: WORK / ABOUT & VISION / CONTACT
- 첫 화면: 소개 문구와 작은 Robotic Stompbox
- WORK: Engineering 3개, Music 2개의 실제 사진과 소개
- ABOUT & VISION: 연구와 음악을 연결하는 짧은 비전
- CONTACT: 이메일과 저작권 표시

프로젝트 카드에는 assets/Home의 실제 사진 5개를 사용합니다. 사진을 누르면 전체 이미지가 확대 창에 표시되고, 닫기 버튼·Esc·바깥 영역 클릭으로 닫을 수 있습니다.
인터랙터의 기능 파일은 유지하고, 홈페이지 style.css에서 표시 영역의 크기만 조절합니다.
