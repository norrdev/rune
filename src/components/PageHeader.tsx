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
    <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 shadow-sm">
      <div className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 -ml-2 hover:bg-gray-100/80 active:scale-95 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer"
            aria-label="Go Back"
          >
            <span className="text-primary text-2xl font-medium leading-none -mt-0.5">‹</span>
          </button>
          <h1 className="text-lg font-extrabold font-display tracking-tight text-gray-800 flex-1 m-0">{title}</h1>
        </div>
      </div>
    </div>
  );
};
