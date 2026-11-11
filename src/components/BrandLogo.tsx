
interface BrandLogoProps {
  className?: string;
}

export default function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <span className={`inline-flex flex-col items-start justify-center font-display font-semibold text-accent-700 leading-none ${className}`}>
      <span className="text-[1.55em] tracking-[0.08em]">ROMA</span>
      <span className="mt-1 text-[0.48em] tracking-[0.36em]">INMOBILIARIA</span>
      <span className="mt-0.5 text-[0.34em] tracking-[0.20em] text-primary-600">PARANÁ</span>
    </span>
  );
}
