import React, { useState, useEffect } from 'react';
import {
  Server,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
  Power,
  Lock,
  Sliders
} from 'lucide-react';
import {
  fetchAdminServices,
  updateAdminServiceStatus,
  registerAdminService,
  fetchServiceHealth,
  fetchAdminMetrics,
  fetchAdminSecurityEvents
} from '../services/api';

export const AdminOperationsPage: React.FC = () => {
  // Mode: Authorized Administrator vs Unauthorized Caller simulation
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(true);
  const adminKey = isAdminAuth ? 'eksetu-admin-key' : '';

  const [services, setServices] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [eventFilter, setEventFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Service Registration Form Modal
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [newService, setNewService] = useState({
    serviceId: '',
    name: '',
    department: '',
    description: '',
    protocol: 'REST',
    apiVersion: 'v1.0.0',
    capabilities: 'STUDENT_VERIFICATION, CERTIFICATE_CHECK',
    supportedFields: 'studentName, qualification'
  });

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [svcData, mtrData, secData] = await Promise.all([
        fetchAdminServices(adminKey),
        fetchAdminMetrics(adminKey),
        fetchAdminSecurityEvents(adminKey, eventFilter || undefined)
      ]);

      setServices(svcData.services || []);
      setMetrics(mtrData.metrics || null);
      setSecurityEvents(secData.events || []);
    } catch (err: any) {
      console.warn('Admin load error:', err.message);
      setError(err.message || 'Access Denied: 403 Forbidden. Administrator credentials required.');
      setServices([]);
      setMetrics(null);
      setSecurityEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [isAdminAuth, eventFilter]);

  const handleToggleStatus = async (serviceId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await updateAdminServiceStatus(serviceId, nextStatus, adminKey);
      setSuccessMsg(`Service '${serviceId}' status updated to ${nextStatus}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to update service status');
    }
  };

  const handleRunHealthCheck = async (serviceId: string) => {
    try {
      const res = await fetchServiceHealth(serviceId);
      setSuccessMsg(`Health check for '${serviceId}': ${res.healthStatus} (${res.responseTimeMs}ms)`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to check health');
    }
  };

  const handleRegisterService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        serviceId: newService.serviceId.trim().toUpperCase(),
        name: newService.name.trim(),
        department: newService.department.trim(),
        description: newService.description.trim(),
        protocol: newService.protocol,
        apiVersion: newService.apiVersion.trim(),
        capabilities: newService.capabilities.split(',').map(s => s.trim()).filter(Boolean),
        supportedFields: newService.supportedFields.split(',').map(s => s.trim()).filter(Boolean),
        status: 'ACTIVE'
      };

      await registerAdminService(payload, adminKey);
      setSuccessMsg(`Service '${payload.serviceId}' registered successfully.`);
      setShowRegisterModal(false);
      setNewService({
        serviceId: '',
        name: '',
        department: '',
        description: '',
        protocol: 'REST',
        apiVersion: 'v1.0.0',
        capabilities: 'STUDENT_VERIFICATION, CERTIFICATE_CHECK',
        supportedFields: 'studentName, qualification'
      });
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to register service');
    }
  };

  // Stats calculation
  const totalCount = services.length;
  const activeCount = services.filter(s => s.status === 'ACTIVE').length;
  const disabledCount = services.filter(s => s.status === 'DISABLED').length;
  const healthyCount = services.filter(s => s.healthStatus === 'HEALTHY').length;
  const degradedCount = services.filter(s => s.healthStatus === 'DEGRADED').length;
  const unavailCount = services.filter(s => s.healthStatus === 'UNAVAILABLE').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              EKSetu V8
            </span>
            <span className="text-xs text-slate-500 font-medium tracking-wide">
              ADMINISTRATION & TELEMETRY
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Operations & Service Registry
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Centralized registry discovery, provider health monitoring, and security event auditing.
          </p>
        </div>

        {/* Demo Security Switch */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium mr-2">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Caller Identity:</span>
          </div>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setIsAdminAuth(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-l-md transition-colors ${
                isAdminAuth
                  ? 'bg-[#0F2642] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Authorized Admin
            </button>
            <button
              onClick={() => setIsAdminAuth(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-r-md transition-colors ${
                !isAdminAuth
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 border-l-0'
              }`}
            >
              Unauthorized Citizen (403 Demo)
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 403 Forbidden State when caller is unauthorized */}
      {!isAdminAuth && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center space-y-3">
          <Lock className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">403 Forbidden — Administrative Access Required</h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            EKSetu enforces authoritative server-side role validation. Citizen or unauthenticated callers cannot access internal service registries, operational metrics, or security audit logs.
          </p>
          <button
            onClick={() => setIsAdminAuth(true)}
            className="px-4 py-2 bg-[#0F2642] text-white text-xs font-semibold rounded-md hover:bg-[#1A4472] transition-colors"
          >
            Switch to Authorized Administrator
          </button>
        </div>
      )}

      {isAdminAuth && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Total Services</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
              <span className="text-xs font-medium text-emerald-700">Active</span>
              <p className="text-2xl font-bold text-emerald-800 mt-1">{activeCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm">
              <span className="text-xs font-medium text-rose-700">Disabled</span>
              <p className="text-2xl font-bold text-rose-800 mt-1">{disabledCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-emerald-600">Healthy</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{healthyCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-amber-600">Degraded</span>
              <p className="text-2xl font-bold text-amber-700 mt-1">{degradedCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-rose-600">Unavailable</span>
              <p className="text-2xl font-bold text-rose-700 mt-1">{unavailCount}</p>
            </div>
          </div>

          {/* Service Registry Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Server className="w-5 h-5 text-sky-600" />
                  <span>Authoritative Service Registry</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Centrally managed provider adapters, protocols, API versions, and capability profiles.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={loadAllData}
                  disabled={loading}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-50 flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="px-3.5 py-1.5 bg-[#0F2642] text-white text-xs font-medium rounded-md hover:bg-[#1A4472] flex items-center space-x-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Service</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Protocol & Version</th>
                    <th className="py-3 px-4">Capabilities</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Health</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map((svc) => (
                    <tr key={svc.serviceId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div>{svc.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{svc.serviceId}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{svc.department}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold mr-1.5 ${
                            svc.protocol === 'SOAP_XML'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {svc.protocol}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">{svc.apiVersion}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {svc.capabilities?.map((cap: string) => (
                            <span
                              key={cap}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            svc.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : svc.status === 'DISABLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {svc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              svc.healthStatus === 'HEALTHY'
                                ? 'bg-emerald-500'
                                : svc.healthStatus === 'DEGRADED'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span className="font-medium text-slate-700">{svc.healthStatus}</span>
                          {svc.responseTimeMs !== undefined && (
                            <span className="text-[11px] text-slate-400">({svc.responseTimeMs}ms)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleRunHealthCheck(svc.serviceId)}
                            title="Run simulated health check"
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium flex items-center space-x-1"
                          >
                            <Activity className="w-3 h-3 text-sky-600" />
                            <span>Ping</span>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(svc.serviceId, svc.status)}
                            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center space-x-1 ${
                              svc.status === 'ACTIVE'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            <span>{svc.status === 'ACTIVE' ? 'Disable' : 'Enable'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Metrics & Security Events 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Operational Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <span>Operational Metrics & Telemetry</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500">Total Requests</span>
                  <div className="text-xl font-bold text-slate-800 mt-0.5">
                    {metrics?.totalRequests ?? 0}
                  </div>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <span className="text-[11px] text-emerald-700">Verified</span>
                  <div className="text-xl font-bold text-emerald-800 mt-0.5">
                    {metrics?.successCount ?? 0}
                  </div>
                </div>
                <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                  <span className="text-[11px] text-amber-700">Partial</span>
                  <div className="text-xl font-bold text-amber-800 mt-0.5">
                    {metrics?.partialCount ?? 0}
                  </div>
                </div>
                <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                  <span className="text-[11px] text-rose-700">Failed / Blocked</span>
                  <div className="text-xl font-bold text-rose-800 mt-0.5">
                    {metrics?.failedCount ?? 0}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-2.5 bg-slate-50 rounded-md">
                  <span className="text-slate-500">Timeouts</span>
                  <div className="font-semibold text-slate-800">{metrics?.providerTimeouts ?? 0}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-md">
                  <span className="text-slate-500">Security Failures</span>
                  <div className="font-semibold text-slate-800">{metrics?.securityFailures ?? 0}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-md">
                  <span className="text-slate-500">Avg Latency</span>
                  <div className="font-semibold text-slate-800">
                    {metrics?.averageResponseLatencyMs ?? 0} ms
                  </div>
                </div>
              </div>

              {/* Service Request Breakdown */}
              {metrics?.requestsByService && Object.keys(metrics.requestsByService).length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 block mb-2">
                    Requests by Service
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(metrics.requestsByService).map(([svc, count]) => (
                      <div key={svc} className="flex justify-between items-center text-slate-600">
                        <span className="font-mono text-slate-800">{svc}</span>
                        <span className="font-semibold text-slate-900">{String(count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Security Events Monitor */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-rose-600" />
                  <span>Security & Gateway Events</span>
                </h2>
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600 bg-white"
                >
                  <option value="">All Events</option>
                  <option value="UNAUTHORIZED_ACCESS_ATTEMPT">Unauthorized Access</option>
                  <option value="ADMIN_ACCESS_DENIED">Admin Access Denied</option>
                  <option value="SERVICE_DISABLED">Service Disabled</option>
                  <option value="CAPABILITY_NOT_SUPPORTED">Capability Not Supported</option>
                  <option value="RATE_LIMITED">Rate Limited</option>
                  <option value="DUPLICATE_REQUEST">Duplicate Request</option>
                </select>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {securityEvents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No security events recorded in current window.
                  </div>
                ) : (
                  securityEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold font-mono text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                          {evt.eventType}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-700">{evt.reason}</p>
                      <div className="text-[10px] text-slate-400 flex space-x-3">
                        <span>Caller: {evt.callerId || 'ANONYMOUS'}</span>
                        {evt.endpoint && <span>Endpoint: {evt.endpoint}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Register Service Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register New Service</h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterService} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service ID (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SKILL_DEV"
                  value={newService.serviceId}
                  onChange={(e) => setNewService({ ...newService, serviceId: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Skill Verification Gateway"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Skill Ministry"
                    value={newService.department}
                    onChange={(e) => setNewService({ ...newService, department: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Protocol</label>
                  <select
                    value={newService.protocol}
                    onChange={(e) => setNewService({ ...newService, protocol: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                  >
                    <option value="REST">REST</option>
                    <option value="SOAP_XML">SOAP_XML</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Capabilities (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={newService.capabilities}
                  onChange={(e) => setNewService({ ...newService, capabilities: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supported Fields (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={newService.supportedFields}
                  onChange={(e) => setNewService({ ...newService, supportedFields: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description (optional)</label>
                <textarea
                  rows={2}
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  placeholder="Service description and scope..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0F2642] text-white rounded font-medium hover:bg-[#1A4472] shadow-sm"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
