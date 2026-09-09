# Abyssal Orbit — 메인트 카드 메이커 v13

## v13 핵심 수정: PNG 저장 안정화
PNG 저장 실패의 원인으로 추정되는 CSS `color-mix()` 사용을 카드 렌더링 영역에서 제거했습니다.

- 화면용 테마 색상은 JavaScript가 일반 RGB/RGBA 값으로 미리 계산
- html2canvas가 해석하기 어려운 최신 CSS 색상 함수 사용 최소화
- canvas → PNG 변환을 `toDataURL()` 대신 `toBlob()` 방식으로 변경
- 다운로드용 Object URL 생성 후 자동 정리
- 캡처할 카드의 실제 width/height를 명시
- PNG 저장 오류 발생 시 실제 오류 메시지를 함께 표시
- 이미지가 없는 상태에서도 저장 가능하도록 렌더링 경로 정리

## 기존 기능
- GENRE 포함 4종 태그 카테고리
- 헤더형/카드형/글자 only 페어
- 밝은/어두운 테마
- 7종 프리셋
- 배경색 / 메인 글씨색 / 별 색상 / 포인트색 사용자 지정
- 폰트 / 글자 크기 선택
- JSON 작업 저장 및 불러오기
- 좌우 독립 스크롤

## GitHub 업데이트
압축을 풀고 `index.html`, `styles.css`, `app.js`, `README.md`를
기존 저장소에 다시 업로드한 뒤 `Commit changes`를 누르세요.
