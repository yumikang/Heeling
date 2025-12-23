
import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-[#0A0F0D] border-t border-gray-800">
            <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
                <div className="mt-8 md:order-1 md:mt-0">
                    <p className="text-center text-xs leading-5 text-gray-400">
                        &copy; {new Date().getFullYear()} Heeling, Inc. 모든 권리 보유.
                    </p>
                </div>
                <div className="flex justify-center md:order-2 space-x-6 md:ml-4">
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Heart className="h-4 w-4 text-[#a3f03a] fill-[#a3f03a]" />
                        <span>마음을 담아 제작되었습니다</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

