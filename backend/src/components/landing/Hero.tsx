
import Link from 'next/link';

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-[#0A0F0D] pt-24 pb-32">
            <div className="container mx-auto px-4 text-center relative z-10">
                <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
                    당신의 <span className="text-[#a3f03a]">내면의 평화</span>를<br />
                    힐링 사운드와 함께
                </h1>
                <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
                    엄선된 힐링 멜로디와 자연의 소리로 마음의 안정을 찾으세요.
                    <br className="hidden sm:block" />
                    Heeling 앱으로 지친 일상에 편안한 휴식을 선물하세요.
                </p>
                <div className="flex justify-center gap-4">
                    <Link
                        href="/#download"
                        className="rounded-full bg-[#a3f03a] px-8 py-4 text-lg font-bold text-black shadow-[0_0_20px_rgba(163,240,58,0.3)] transition-transform hover:scale-105 hover:shadow-[0_0_30px_rgba(163,240,58,0.5)]"
                    >
                        무료로 시작하기
                    </Link>
                    <Link
                        href="/admin"
                        className="rounded-full border border-gray-700 bg-white/5 px-8 py-4 text-lg font-semibold text-gray-300 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-gray-500"
                    >
                        관리자 접속
                    </Link>
                </div>
            </div>

            {/* Abstract Background Shapes */}
            <div className="pointer-events-none absolute top-[-20%] left-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#a3f03a]/20 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-[#1a4d2e]/40 blur-[100px]" />
            <div className="pointer-events-none absolute top-[20%] left-[-10%] -z-10 h-[400px] w-[400px] rounded-full bg-[#a3f03a]/10 blur-[80px]" />
        </section>
    );
}

