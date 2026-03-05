import React from 'react';

const EarthMonkLogo = ({ className = "w-full h-full" }: { className?: string }) => {
    return (
        <div className={`relative flex flex-col items-center justify-center ${className}`}>
            <svg
                viewBox="0 0 400 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]"
            >
                {/* Main Icon - Stylized The House of Earthmonk Body */}
                <path
                    d="M100 220L200 80L300 220H100Z"
                    fill="#1A1512"
                    stroke="#D4AF37"
                    strokeWidth="4"
                    strokeLinejoin="round"
                />
                {/* Left Shoulder/Mountain */}
                <path
                    d="M100 220L160 140L190 220H100Z"
                    fill="#1A1512"
                    stroke="#D4AF37"
                    strokeWidth="3"
                />
                {/* Sun/Head Symbol */}
                <circle
                    cx="200"
                    cy="70"
                    r="25"
                    fill="#1A1512"
                    stroke="#D4AF37"
                    strokeWidth="4"
                />

                {/* Text Area */}
                <text
                    x="200"
                    y="260"
                    textAnchor="middle"
                    className="font-serif text-[18px] uppercase tracking-[0.3em]"
                    fill="#D4AF37"
                    style={{ filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.3))' }}
                >
                    The House Of
                </text>
                <text
                    x="200"
                    y="290"
                    textAnchor="middle"
                    className="font-serif text-[24px] font-bold uppercase tracking-[0.4em]"
                    fill="#D4AF37"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.5))' }}
                >
                    Earth Monk
                </text>
            </svg>
        </div>
    );
};

export default EarthMonkLogo;
