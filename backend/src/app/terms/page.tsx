export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">이용약관</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            시행일: 2024년 12월 1일
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제1조 (목적)</h2>
            <p className="text-gray-700">
              이 약관은 BRIBI(이하 "회사")가 제공하는 음악 스트리밍 서비스(이하 "서비스")의 이용 조건 및 절차,
              회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제2조 (정의)</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>"서비스"란 회사가 제공하는 음악 스트리밍 및 관련 부가서비스를 의미합니다.</li>
              <li>"회원"이란 이 약관에 따라 이용계약을 체결하고 서비스를 이용하는 자를 의미합니다.</li>
              <li>"콘텐츠"란 서비스 내에서 제공되는 음악, 이미지, 텍스트 등 모든 자료를 의미합니다.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>이 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 그 효력을 발생합니다.</li>
              <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.</li>
              <li>약관이 변경되는 경우 회사는 변경사항을 시행일 7일 전부터 서비스 내 공지합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제4조 (서비스의 제공)</h2>
            <p className="text-gray-700 mb-4">
              회사는 다음과 같은 서비스를 제공합니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>음악 스트리밍 서비스</li>
              <li>오프라인 재생을 위한 다운로드 서비스</li>
              <li>맞춤형 음악 추천 서비스</li>
              <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제5조 (서비스 이용료)</h2>
            <p className="text-gray-700 mb-4">
              서비스는 무료 및 유료로 구분됩니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>무료 서비스: 광고 포함, 오프라인 다운로드 500MB 제한</li>
              <li>프리미엄 서비스: 광고 없음, 무제한 오프라인 다운로드, 고음질 스트리밍</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제6조 (회원의 의무)</h2>
            <p className="text-gray-700 mb-4">
              회원은 다음 행위를 하여서는 안 됩니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>타인의 정보를 도용하는 행위</li>
              <li>서비스에서 얻은 정보를 무단으로 복제, 배포하는 행위</li>
              <li>서비스의 운영을 방해하는 행위</li>
              <li>기타 관계 법령에 위배되는 행위</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제7조 (저작권)</h2>
            <p className="text-gray-700">
              서비스 내 모든 콘텐츠의 저작권은 회사 또는 원저작권자에게 있으며,
              회원은 서비스를 통해 얻은 콘텐츠를 개인적인 용도로만 이용할 수 있습니다.
              회원이 콘텐츠를 무단으로 복제, 배포, 전송하는 경우 저작권법에 따른 책임을 질 수 있습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제8조 (서비스의 중단)</h2>
            <p className="text-gray-700">
              회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신두절 등의 사유가 발생한 경우에는
              서비스의 제공을 일시적으로 중단할 수 있습니다.
              이 경우 회사는 사전에 회원에게 통지합니다. 다만, 부득이한 사유가 있는 경우 사후에 통지할 수 있습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제9조 (면책조항)</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
              <li>회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대해서는 책임을 지지 않습니다.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제10조 (분쟁해결)</h2>
            <p className="text-gray-700">
              이 약관에서 정하지 않은 사항과 이 약관의 해석에 관하여는 대한민국 법령 및 상관례에 따릅니다.
              서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">부칙</h2>
            <p className="text-gray-700">
              이 약관은 2024년 12월 1일부터 시행합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
