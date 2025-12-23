export default function AppPreview() {
    return (
        <section className="bg-[#0A0F0D] py-24 sm:py-32 overflow-hidden relative">
            <div className="container mx-auto px-4 z-10 relative">
                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2 lg:items-center text-center lg:text-left">
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            언제 어디서나 평온함을<br />
                            경험하세요
                        </h2>
                        <p className="mt-6 text-lg leading-8 text-gray-400">
                            Heeling 앱을 다운로드하여 나만의 휴식 공간을 항상 휴대하세요.
                            지하철, 사무실, 침실 어디서든 평화를 찾을 수 있습니다.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                            {/* App Store Buttons Placeholder */}
                            <div className="h-14 w-44 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white font-semibold hover:bg-white/20 transition-colors cursor-pointer">
                                App Store
                            </div>
                            <div className="h-14 w-44 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white font-semibold hover:bg-white/20 transition-colors cursor-pointer">
                                Google Play
                            </div>
                        </div>
                    </div>

                    <div className="relative mx-auto w-full max-w-[366px]">
                        {/* Phone Frame Placeholder */}
                        <div className="relative aspect-[9/19] rounded-[2.5rem] bg-gray-900 shadow-2xl ring-8 ring-gray-800">
                            <div className="absolute inset-[2px] rounded-[2.3rem] bg-[#0A0F0D] overflow-hidden flex items-center justify-center border border-gray-800">
                                <span className="text-gray-500 font-medium text-center p-4">App Screenshot Placeholder</span>
                            </div>
                        </div>
                        {/* Decorative blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[500px] w-[500px] bg-[#a3f03a]/20 rounded-full blur-[100px]" />
                    </div>
                </div>
            </div>
        </section>
    );
}
