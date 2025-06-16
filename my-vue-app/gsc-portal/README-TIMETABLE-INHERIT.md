# timetable_events 교수명/강의실 상속 기능 구현 가이드

## 개요

이 문서는 `timetable_events` 테이블에서 `timetables` 테이블의 교수명(professor_name)과 강의실(room) 정보를 상속받는 기능 구현에 관한 내용을 담고 있습니다.

## 주요 변경 사항

1. 데이터베이스: `timetable_events` 테이블에 `inherit_attributes` 컬럼 추가
2. 백엔드: 이벤트 조회/등록 API에서 상속 로직 구현
3. 프론트엔드: 상속된 값 표시 및 이벤트 등록 시 상속 옵션 제공

## 1. 데이터베이스 마이그레이션

테이블 구조를 변경하기 위해 SQL 마이그레이션 파일을 생성했습니다.

### 마이그레이션 실행 방법

1. 자동 방법 (관리자 권한 필요):
   - 관리자 계정으로 로그인 후 아래 URL 접속 (POST 요청)
   ```
   POST /api/admin/migrations/add-inherit-attributes
   ```

2. 수동 방법:
   - 제공된 스크립트 실행
   ```bash
   cd /Users/gwan/WebstormProjects/Front_end/my-vue-app/gsc-portal/backend
   node scripts/run-migration.js
   ```

### 변경 내용

- `timetable_events` 테이블에 `inherit_attributes` 컬럼 추가 (TINYINT, 기본값 0)
- 기존 데이터 중 `timetable_id`가 존재하면서 `professor_name`이나 `room`이 없는 레코드는 자동으로 `inherit_attributes`를 1로 설정

## 2. 백엔드 변경 사항

### timetableController.js

1. `getWeeklyTimetable` 함수 수정:
   - SQL 쿼리에서 `timetables`의 교수명과 강의실을 상속 정보와 함께 조회
   - 응답 데이터에 상속된 필드 포함

2. `createEvent` 함수 수정:
   - 이벤트 생성 시 `inherit_attributes` 필드 처리
   - 이벤트 조회 시 상속 로직 적용

## 3. 프론트엔드 변경 사항

### DetailEventModal.vue

1. 교수명과 강의실 정보 표시 로직 추가:
   - `inherit_attributes`가 1이면 상속된 값 표시
   - 상속 여부를 "(상속됨)" 표시로 구분

2. 헬퍼 함수 추가:
   - `getEffectiveProfessorName`: 유효한 교수명 계산
   - `getEffectiveRoom`: 유효한 강의실 계산
   - `isInheritedField`: 특정 필드의 상속 여부 확인

### RegisterEventModal.vue

1. 이벤트 등록 시 상속 옵션 제공:
   - `timetable_id`가 존재할 때 "원본 수업의 교수명과 강의실 정보 사용" 체크박스 추가
   - 체크박스 선택 시 교수명/강의실 입력 필드 비활성화

### TimetableCell.vue

1. 교수명과 강의실 표시 로직 개선:
   - 상속 로직을 적용한 헬퍼 함수 사용
   - 툴팁 텍스트에도 상속된 값 반영

### timetable.js (Store)

1. 이벤트 생성/등록 함수 수정:
   - `createTimetableEvent`, `registerCancellation`, `registerMakeup` 함수에서 `inherit_attributes` 처리
   - API 요청 시 Boolean → 0/1 변환

## 설정 및 사용법

1. 마이그레이션 실행하여 DB 스키마 업데이트
2. 서버 재시작
3. 이벤트 등록 시 원본 수업이 있는 경우 "원본 수업의 교수명과 강의실 정보 사용" 옵션 활성화

## 주의 사항

- 기존 데이터는 마이그레이션 과정에서 자동으로 `inherit_attributes` 값이 설정됩니다.
- 특수한 경우나 오류가 발생하면 수동으로 `inherit_attributes` 값을 조정해야 할 수 있습니다. 