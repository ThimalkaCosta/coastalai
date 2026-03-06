import React, { useState, useMemo } from 'react';

const YearlyShorelineTable = ({ data }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'year', direction: 'asc' });

  const sortedData = useMemo(() => {
    if (!data) return [];
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getErosionStatusColor = (status) => {
    switch (status) {
      case 'High Erosion':
        return 'bg-red-100 text-red-800';
      case 'Low Erosion':
        return 'bg-orange-100 text-orange-800';
      case 'Stable':
        return 'bg-sky-100 text-sky-700';
      case 'Low Accretion':
        return 'bg-teal-100 text-teal-700';
      case 'High Accretion':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-gray-400 ml-1">⇅</span>;
    }
    return sortConfig.direction === 'asc' ? 
      <span className="ml-1">↑</span> : 
      <span className="ml-1">↓</span>;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No yearly shoreline data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 sticky top-0 z-10">
              <tr>
                <th 
                  onClick={() => handleSort('year')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  Year <SortIcon columnKey="year" />
                </th>
                <th 
                  onClick={() => handleSort('annual_NSM')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  Annual NSM <SortIcon columnKey="annual_NSM" />
                </th>
                <th 
                  onClick={() => handleSort('NSM_median')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  NSM Median <SortIcon columnKey="NSM_median" />
                </th>
                <th 
                  onClick={() => handleSort('NSM_std')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  NSM Std <SortIcon columnKey="NSM_std" />
                </th>
                <th 
                  onClick={() => handleSort('NSM_min')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  NSM Min <SortIcon columnKey="NSM_min" />
                </th>
                <th 
                  onClick={() => handleSort('NSM_max')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  NSM Max <SortIcon columnKey="NSM_max" />
                </th>
                <th 
                  onClick={() => handleSort('NSM_count')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  Count <SortIcon columnKey="NSM_count" />
                </th>
                <th 
                  onClick={() => handleSort('EPR_mean')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  EPR Mean <SortIcon columnKey="EPR_mean" />
                </th>
                <th 
                  onClick={() => handleSort('EPR_median')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  EPR Median <SortIcon columnKey="EPR_median" />
                </th>
                <th 
                  onClick={() => handleSort('LRR_mean')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  LRR Mean <SortIcon columnKey="LRR_mean" />
                </th>
                <th 
                  onClick={() => handleSort('LRR_median')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  LRR Median <SortIcon columnKey="LRR_median" />
                </th>
                <th 
                  onClick={() => handleSort('SCE_mean')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  SCE Mean <SortIcon columnKey="SCE_mean" />
                </th>
                <th 
                  onClick={() => handleSort('SCE_max')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  SCE Max <SortIcon columnKey="SCE_max" />
                </th>
                <th 
                  onClick={() => handleSort('Erosion_Status')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  Erosion Status <SortIcon columnKey="Erosion_Status" />
                </th>
                <th 
                  onClick={() => handleSort('Erosion_Binary')}
                  className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  Binary <SortIcon columnKey="Erosion_Binary" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((row, index) => (
                <tr 
                  key={row.year}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.year}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {row.annual_NSM?.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {row.NSM_median?.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {row.NSM_std?.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {row.NSM_min?.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {row.NSM_max?.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {row.NSM_count}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {row.EPR_mean?.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {row.EPR_median?.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {row.LRR_mean?.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {row.LRR_median?.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {row.SCE_mean?.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {row.SCE_max?.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getErosionStatusColor(row.Erosion_Status)}`}>
                      {row.Erosion_Status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.Erosion_Binary === 1 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {row.Erosion_Binary}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Summary Statistics */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Years</p>
              <p className="text-lg font-semibold text-gray-900">{sortedData.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Erosion Years</p>
              <p className="text-lg font-semibold text-red-600">
                {sortedData.filter(row => row.Erosion_Binary === 1).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Stable Years</p>
              <p className="text-lg font-semibold text-green-600">
                {sortedData.filter(row => row.Erosion_Binary === 0).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Avg NSM</p>
              <p className="text-lg font-semibold text-gray-900">
                {(sortedData.reduce((sum, row) => sum + row.annual_NSM, 0) / sortedData.length).toFixed(3)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearlyShorelineTable;
