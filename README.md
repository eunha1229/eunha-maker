# Abyssal Orbit — 메인트 카드 메이커

서버 없이 GitHub Pages에서 바로 동작하는 정적 웹사이트 프로토타입입니다.

## 들어 있는 기능
- 실시간 카드 미리보기
- 프로필 이미지 업로드
- 태그 추가/삭제
- 페어 3종
  - 헤더형(대): 큰 대표 페어
  - 카드형(중): 이미지 + 이름 + 설명
  - 글자 only(소): 이름 + 설명
- 페어 순서 이동 / 삭제
- 우주 × 심해 계열 테마
- 포인트 컬러 2종 변경
- 작업 내용을 JSON으로 저장 / 다시 불러오기
- 완성 카드를 고해상도 PNG로 저장

## GitHub Pages에 올리기
1. GitHub에서 새 repository 생성
2. 이 폴더의 `index.html`, `styles.css`, `app.js` 업로드
3. repository의 Settings → Pages
4. Deploy from a branch 선택
5. Branch `main`, folder `/ (root)` 선택 후 Save
6. 잠시 뒤 표시되는 GitHub Pages 주소로 접속

## 메모
PNG 출력은 `html2canvas` CDN을 사용합니다.
사용자가 직접 업로드한 이미지는 브라우저 내부 data URL로 처리되며 별도 서버에 저장하지 않습니다.
