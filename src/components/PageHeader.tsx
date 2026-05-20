import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
}

export const PageHeader = ({ title }: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 py-3 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-12 h-12 -ml-3 hover:opacity-75 transition-opacity flex items-center justify-center"
            aria-label="Go Back"
          >
            <span className="text-primary text-3xl font-light leading-none">‹</span>
          </button>
          <h1 className="text-xl font-semibold text-gray-900 flex-1 m-0">{title}</h1>
        </div>
      </div>
    </div>
  );
};
