import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, ShieldCheck, Activity, Users } from 'lucide-react';
import { MetricCardProps } from '../types';

const data = [
  { name: '00:00', fraud: 4, safe: 240 },
  { name: '04:00', fraud: 3, safe: 139 },
  { name: '08:00', fraud: 12, safe: 980 },
  { name: '12:00', fraud: 27, safe: 1208 },
  { name: '16:00', fraud: 18, safe: 1100 },
  { name: '20:00', fraud: 9, safe: 850 },
  { name: '23:59', fraud: 5, safe: 430 },
];

const fraudTypes = [
  { name: 'Deepfake Video', value: 45 },
  { name: 'Voice Clone', value: 25 },
  { name: 'Synthetic ID', value: 20 },
  { name: 'Doc Forgery', value: 10 },
];

const COLORS = ['#ef4444', '#f97316', '#eab308', '#64748b'];

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, trend, icon }) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      </div>
      <div className="p-2 bg-slate-800 rounded-lg text-slate-300">
        {icon}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
        trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 
        trend === 'down' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'
      }`}>
        {change}
      </span>
      <span className="text-xs text-slate-500">vs last 24h</span>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Security Overview</h2>
        <div className="flex gap-2">
          <select className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Scans" 
          value="142,893" 
          change="+12.5%" 
          trend="up" 
          icon={<Activity size={20} />} 
        />
        <MetricCard 
          title="Fraud Prevented" 
          value="1,204" 
          change="-2.4%" 
          trend="down" 
          icon={<ShieldCheck size={20} />} 
        />
        <MetricCard 
          title="Avg Risk Score" 
          value="14.2" 
          change="+1.2%" 
          trend="up" 
          icon={<AlertTriangle size={20} />} 
        />
        <MetricCard 
          title="Active Sessions" 
          value="892" 
          change="+5.4%" 
          trend="up" 
          icon={<Users size={20} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Fraud Detection Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="fraud" stroke="#ef4444" fillOpacity={1} fill="url(#colorFraud)" />
                <Area type="monotone" dataKey="safe" stroke="#10b981" fillOpacity={1} fill="url(#colorSafe)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Attack Vectors</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fraudTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {fraudTypes.map((type, index) => (
              <div key={type.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-slate-300">{type.name}</span>
                </div>
                <span className="text-slate-500">{type.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;