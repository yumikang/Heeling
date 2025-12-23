
import { AudioLines, Battery, Moon, Sparkles, Wind, Zap } from 'lucide-react';

const features = [
    {
        name: '숙면 유도',
        description: '엄선된 딥 슬립 주파수와 밤의 소리로 깊은 잠에 빠져보세요.',
        icon: Moon,
    },
    {
        name: '스트레스 완화',
        description: '코르티솔 수치를 낮추고 평온한 자연의 소리 속에서 마음의 중심을 찾으세요.',
        icon: Wind,
    },
    {
        name: '집중력 향상',
        description: '깊은 몰입을 위해 설계된 바이노럴 비트로 생산성을 높이세요.',
        icon: Zap,
    },
    {
        name: '깊은 명상',
        description: '가이드 명상과 배경 음악으로 더 깊은 마음 챙김 상태에 도달하세요.',
        icon: Sparkles,
    },
    {
        name: '에너지 충전',
        description: '빠른 충전이 필요하신가요? 파워 냅 트랙으로 활력을 되찾으세요.',
        icon: Battery,
    },
    {
        name: '고음질 오디오',
        description: '사운드스케이프의 모든 디테일을 담은 선명한 무손실 오디오를 경험하세요.',
        icon: AudioLines,
    },
];

export default function Features() {
    return (
        <section className="bg-[#0f1412] py-24 sm:py-32" id="features">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        진정한 휴식을 위한 모든 것
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-gray-400">
                        당신의 웰니스 목표를 달성할 수 있도록 설계된 다양한 사운드와 기능을 만나보세요.
                    </p>
                </div>

                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.name} className="flex flex-col items-center text-center group">
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#a3f03a]/10 transition-colors group-hover:bg-[#a3f03a]/20">
                                    <feature.icon className="h-8 w-8 text-[#a3f03a]" aria-hidden="true" />
                                </div>
                                <dt className="text-xl font-semibold leading-7 text-gray-100">
                                    {feature.name}
                                </dt>
                                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-400">
                                    <p className="flex-auto">{feature.description}</p>
                                </dd>

                                {/* Image Placeholder */}
                                <div className="mt-6 h-48 w-full overflow-hidden rounded-xl bg-gray-900 border-2 border-dashed border-gray-800 flex items-center justify-center group-hover:border-[#a3f03a]/30 transition-colors">
                                    <span className="text-gray-600 font-medium">Image Placeholder: {feature.name}</span>
                                </div>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
}

