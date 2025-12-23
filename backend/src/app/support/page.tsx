export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">고객 지원</h1>
          <p className="text-gray-600">
            BRIBI 서비스 이용 중 궁금한 점이나 문제가 있으시면 아래 방법으로 문의해 주세요.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">문의 방법</h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">이메일 문의</h3>
                <p className="mt-1 text-gray-600">support@bribi.app</p>
                <p className="mt-1 text-sm text-gray-500">영업일 기준 24시간 이내 답변드립니다.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">자주 묻는 질문</h3>
                <p className="mt-1 text-gray-600">아래에서 자주 묻는 질문을 확인해 보세요.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">자주 묻는 질문 (FAQ)</h2>

          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Q. 프리미엄 구독은 어떻게 취소하나요?
              </h3>
              <p className="text-gray-600">
                A. 앱 내 설정 → 구독 관리에서 구독을 취소할 수 있습니다.
                iOS의 경우 App Store 설정에서, Android의 경우 Google Play Store 설정에서 직접 취소도 가능합니다.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Q. 오프라인 다운로드는 어떻게 사용하나요?
              </h3>
              <p className="text-gray-600">
                A. 음악 재생 화면에서 다운로드 버튼을 누르면 기기에 저장됩니다.
                무료 사용자는 500MB까지, 프리미엄 사용자는 무제한으로 다운로드할 수 있습니다.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Q. 계정을 삭제하고 싶어요.
              </h3>
              <p className="text-gray-600">
                A. 앱 내 설정 → 계정 관리 → 계정 삭제에서 진행할 수 있습니다.
                계정 삭제 시 모든 데이터가 영구적으로 삭제되며 복구가 불가능합니다.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Q. 음악이 재생되지 않아요.
              </h3>
              <p className="text-gray-600">
                A. 네트워크 연결 상태를 확인해 주세요. 문제가 지속되면 앱을 완전히 종료 후 다시 실행하거나,
                앱을 최신 버전으로 업데이트해 주세요.
              </p>
            </div>

            <div className="pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Q. 음악의 저작권은 어떻게 되나요?
              </h3>
              <p className="text-gray-600">
                A. BRIBI에서 제공하는 모든 음악은 자체 제작된 오리지널 콘텐츠입니다.
                개인적인 감상 목적으로 자유롭게 이용하실 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2024 BRIBI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
