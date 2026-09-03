import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import RegionDetailContent from '../components/RegionDetailContent';

export default function RegionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-10">
      <button onClick={() => navigate('/regions')} className="flex items-center gap-1.5 text-[12px] text-stone-500 hover:text-stone-900">
        <ArrowLeft size={13} /> Back to regions
      </button>
      <RegionDetailContent regionId={id!} />
    </div>
  );
}
