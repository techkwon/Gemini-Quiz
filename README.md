# 🎓 Gemini Quiz Mate (제미나이 퀴즈 메이트)

**Gemini Quiz Mate**는 선생님과 학생이 함께 즐길 수 있는 **AI 기반 실시간 인터랙티브 퀴즈 플랫폼**입니다.  
구글의 **Gemini AI**를 활용하여 퀴즈를 자동으로 생성하고, **Firebase**를 통해 실시간 멀티플레이어 게임 환경을 제공합니다.

🔗 **Live Demo**: [https://gemini-quiz-ten.vercel.app](https://gemini-quiz-ten.vercel.app)

---

## ✨ 주요 기능 (Key Features)

### 👩‍🏫 선생님 (Teacher)
*   **AI 퀴즈 자동 생성**: 주제만 입력하면 Gemini AI가 객관식 퀴즈를 자동으로 만들어줍니다.
*   **퀴즈 관리**: 생성된 퀴즈를 수정, 삭제하거나 직접 새로운 문제를 추가할 수 있습니다.
*   **실시간 게임 호스팅**: QR 코드나 PIN 번호로 학생들을 초대하여 게임을 시작할 수 있습니다.
*   **대시보드**: 퀴즈 라이브러리를 그리드/리스트 뷰로 관리하고 게임 진행 상황을 모니터링합니다.

### 👨‍🎓 학생 (Student)
*   **간편한 접속**: 별도의 회원가입 없이 닉네임과 PIN 번호(또는 QR 코드)만으로 게임에 참여할 수 있습니다.
*   **게임화된 학습 (Gamification)**:
    *   **마리오 모드**: 점프하고 달리며 정답 블록을 맞추는 플랫포머 게임 방식.
    *   **원펀맨 모드**: (New) 히어로 협회 시험을 테마로 한 액션 퀴즈 게임. (한글화 완료)
    *   **티니핑 월드**: (New) 티니핑 친구들과 함께하는 3D 런게임 방식의 퀴즈 모험. 🏰 (Three.js 기반)
    *   **배틀 모드**: (New) 탄지로 vs 고죠! 1:1 대전 격투 컨셉의 퀴즈 액션 게임. ⚔️
*   **실시간 피드백**: 정답 여부를 즉시 확인하고 점수를 획득합니다.
*   **모던 UI & 다크모드**:
    *   **MacBook Style**: Glassmorphism과 깔끔한 타이포그래피가 적용된 세련된 디자인.
    *   **다크모드 지원**: 시스템 설정에 따라 자동으로 전환되는 눈이 편안한 다크모드.

---

## 🛠 기술 스택 (Tech Stack)

*   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Backend / DB**: [Firebase](https://firebase.google.com/) (Firestore, Auth)
*   **AI**: [Google Gemini API](https://ai.google.dev/) (`@google/generative-ai`)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Animation**: [Framer Motion](https://www.framer.com/motion/)

---

## 🚀 시작하기 (Getting Started)

이 프로젝트를 로컬 환경에서 실행하려면 다음 단계들을 따라주세요.

### 1. 필수 요구사항
*   Node.js 18.17.0 이상
*   npm, yarn, pnpm, 또는 bun

### 2. 설치 (Installation)

```bash
# 저장소 복제 (Clone the repository)
git clone https://github.com/your-username/gemini-quiz-mate.git

# 프로젝트 폴더로 이동
cd gemini-quiz-mate

# 패키지 설치
npm install
# or
yarn install
```

### 3. 환경 변수 설정 (Environment Setup)

프로젝트 루트 경로에 `.env.local` 파일을 생성하고 다음 변수들을 설정해야 합니다.

**Firebase 설정:**
Firebase 콘솔에서 웹 앱을 생성하고 발급받은 키를 입력하세요.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Gemini AI 설정:**
Google AI Studio에서 API 키를 발급받아 입력하세요.

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 4. 실행 (Run)

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

---

## 📂 프로젝트 구조 (Project Structure)

```
app/
├── host/           # 호스트(선생님) 게임 진행 화면
├── play/           # 학생 게임 참여 및 플레이 화면
├── teacher/        # 선생님 대시보드 및 퀴즈 생성
├── api/            # Next.js API Routes
├── layout.tsx      # 루트 레이아웃
└── page.tsx        # 랜딩 페이지
components/
├── games/          # 게임 로직 컴포넌트 (MarioGame, etc.)
└── ui/             # 재사용 가능한 UI 컴포넌트
lib/
├── firebase.ts     # Firebase 초기화 및 설정
└── gemini.ts       # Gemini API 유틸리티
```

---

## 📝 라이선스 (License)

This project is licensed under the MIT License.
