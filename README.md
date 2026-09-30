# 사내 운영 포털 파일 안내

페이지마다 폴더 하나를 사용합니다. 각 폴더의 index.html은 화면 구성, style.css는 디자인, script.js는 동작을 관리합니다.

| 페이지 | 폴더 |
| --- | --- |
| 로그인 | login/ |
| 운영 포털 메인 | main/ |
| 관리자 메인 | admin/main/ |
| 자재 입출고·생산 | inventory/ |
| 부자재 발주 관리 | procurement/ |
| 관리자 부자재·BOM 설정 | admin/materials/ |
| 관리자 계정 관리 | admin/accounts/ |
| 관리자 직원 관리 | admin/employees/ |
| 관리자 메뉴 권한 연결 | admin/permissions/ |
| 관리자 출퇴근 관리 | admin/clock/ |
| 휴가 관리 | main/leave/ |
| 출퇴근 입력 | main/checkin/ |

shared/는 여러 페이지가 함께 사용하는 디자인과 재고·BOM 기능입니다. 공통 기능은 여기에서 수정합니다.

기존 *.html 주소는 새 폴더의 페이지로 자동 이동합니다. 실제 화면 수정은 위 폴더 안의 파일에서 진행하세요.

모든 내부 연결은 상대경로입니다. GitHub Pages의 사용자 도메인 또는 다른 정적 호스팅으로 옮길 때 폴더 구조 전체를 유지하면 됩니다.

현재 재고 데이터는 브라우저 localStorage에 저장되는 시연 데이터입니다.
