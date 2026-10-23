import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@/lib/i18n/translation-context';
import { ArrowLeftIcon, MapPinAreaIcon } from '@/components/icons/icons';

interface MobileBreadcrumProps {
    title: string;
    className?: string;
    headerAction?: React.ReactNode
}

const MobileBreadcrum: React.FC<MobileBreadcrumProps> = ({ title, className, headerAction }) => {
    const router = useRouter();

    return (
        <div className={`bg-bg-primary h-14 flex items-center xl:hidden ${className}`}>
            <div className="container">
                <div className='flex items-center justify-between'>
                    <div className="flex items-center gap-4 justify-baseline">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="p-0 min-w-fit h-auto shrink-0 border-0 bg-transparent"
                        >
                            <ArrowLeftIcon className='size-6 rtl:rotate-180' />
                        </button>
                        <span className='text-base font-semibold'>{title}</span>
                    </div>
                    {headerAction && <div className={``}>{headerAction}</div>}
                </div>
            </div>
        </div>
    );
};

export default MobileBreadcrum;
