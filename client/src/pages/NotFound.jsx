import { Link } from 'react-router-dom';
export default function NotFound({ standalone }) {
  return (
    <div className={`grid place-items-center ${standalone ? 'min-h-full' : 'py-24'}`}>
      <div className="text-center">
        <p className="text-6xl font-bold text-accent">404</p>
        <p className="mt-2 font-semibold">This page doesn't exist</p>
        <p className="mt-1 text-sm text-mute">Check the address, or head back to your dashboard.</p>
        <Link to="/" className="btn-primary mt-5">Go to dashboard</Link>
      </div>
    </div>
  );
}
