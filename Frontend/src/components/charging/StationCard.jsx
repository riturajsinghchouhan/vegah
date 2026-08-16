import { Clock3, MapPinned, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const StationCard = ({ station }) => (
  <Link className="block overflow-hidden p-4 bg-white rounded-[22px] shadow-sm border border-white transition-all duration-300 hover:border-emerald-100 hover:shadow-md hover:-translate-y-1" to={`/charging/${station.id}`}>
    <div className="relative">
      <img alt={station.name} className="h-40 w-full rounded-2xl object-cover shadow-sm" src={station.image} />
      <div className="absolute top-3 right-3 rounded-lg bg-white/90 backdrop-blur-md border border-white/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 shadow-sm">
        {station.openStatus}
      </div>
    </div>

    <div className="mt-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-bold text-slate-800">{station.name}</h3>
        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
          <MapPinned size={12} /> {station.address}
        </p>
      </div>
    </div>

    <div className="mt-4 grid gap-y-2.5 gap-x-2 text-[11px] font-medium text-slate-500 sm:grid-cols-2 pt-3 border-t border-slate-100">
      <span className="flex items-center gap-1.5">
        <Star size={14} className="text-amber-400" />
        <span className="text-slate-800">{station.rating} <span className="text-slate-400">({station.totalChargers})</span></span>
      </span>
      <span className="flex items-center gap-1.5">
        <MapPinned size={14} className="text-emerald-500" />
        <span><span className="text-slate-800">{station.distanceKm}</span> km away</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Clock3 size={14} className="text-slate-400" />
        <span><span className="text-slate-800">{station.driveMinutes}</span> min drive</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Zap size={14} className="text-emerald-500" />
        <span><span className="text-slate-800">{station.availableChargers}/{station.totalChargers}</span> chargers</span>
      </span>
    </div>
  </Link>
);

export default StationCard;
