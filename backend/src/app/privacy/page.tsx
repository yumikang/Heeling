export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            시행일: 2024년 12월 1일
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. 개인정보의 수집 및 이용 목적</h2>
            <p className="text-gray-700 mb-4">
              BRIBI(이하 "회사")는 다음과 같은 목적으로 개인정보를 수집 및 이용합니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>서비스 제공 및 회원 관리</li>
              <li>콘텐츠 추천 및 맞춤형 서비스 제공</li>
              <li>서비스 개선 및 신규 서비스 개발</li>
              <li>고객 문의 응대 및 불만 처리</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. 수집하는 개인정보 항목</h2>
            <p className="text-gray-700 mb-4">
              회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>소셜 로그인 시: 이메일 주소, 이름 (Apple/Google 제공 정보)</li>
              <li>자동 수집 정보: 기기 정보, 앱 사용 기록, 재생 기록</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. 개인정보의 보유 및 이용 기간</h2>
            <p className="text-gray-700 mb-4">
              회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
              단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>회원 탈퇴 시: 즉시 파기</li>
              <li>관련 법령에 의한 보관: 해당 법령에서 정한 기간</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. 개인정보의 제3자 제공</h2>
            <p className="text-gray-700">
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
              다만, 법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위해 불가피한 경우에는 예외로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. 개인정보의 파기</h2>
            <p className="text-gray-700">
              회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는
              지체 없이 해당 개인정보를 파기합니다. 전자적 파일 형태의 정보는 기술적 방법을 사용하여 삭제합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. 이용자의 권리</h2>
            <p className="text-gray-700 mb-4">
              이용자는 언제든지 자신의 개인정보에 대해 다음과 같은 권리를 행사할 수 있습니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. 개인정보 보호책임자</h2>
            <p className="text-gray-700">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고,
              개인정보 처리와 관련한 이용자의 불만 처리 및 피해 구제를 위해 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">담당: BRIBI 운영팀</p>
              <p className="text-gray-700">이메일: support@bribi.app</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. 개인정보처리방침의 변경</h2>
            <p className="text-gray-700">
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는
              변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
