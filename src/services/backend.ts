import axios from 'axios';
import { api } from '../lib/api';
export const api = {
  baseURL: API_BASE_URL, // ✅ هنا
  auth: {
    register: `${API_BASE_URL}/api/auth/register`,
    login: `${API_BASE_URL}/api/auth/login`,
    validateToken: `${API_BASE_URL}/api/auth/validate-token`,
    logout: `${API_BASE_URL}/api/auth/logout`,
  },
  players: {
    list: `${API_BASE_URL}/api/players`,
    create: `${API_BASE_URL}/api/players`,
    get: (id: string) => `${API_BASE_URL}/api/players/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/players/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/players/${id}`,
  },
  teams: {
    list: `${API_BASE_URL}/api/teams`,
    create: `${API_BASE_URL}/api/teams`,
    get: (id: string) => `${API_BASE_URL}/api/teams/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/teams/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/teams/${id}`,
  },
};

// Generic helpers
const get = async <T>(url: string, params?: Record<string, unknown>) => {
  const res = await axios.get<T>(url, { baseURL: api.baseURL, params });
  return res.data as T;
};

const post = async <T>(url: string, body?: unknown) => {
  const res = await axios.post<T>(url, body ?? {}, { baseURL: api.baseURL });
  return res.data as T;
};

const patch = async <T>(url: string, body?: unknown) => {
  const res = await axios.patch<T>(url, body ?? {}, { baseURL: api.baseURL });
  return res.data as T;
};

const del = async <T>(url: string) => {
  const res = await axios.delete<T>(url, { baseURL: api.baseURL });
  return res.data as T;
};

// Auth
export const authClient = {
  validateToken: (token: string) => post<{ success: boolean; data?: unknown }>(api.auth.validateToken, { token }),
  logout: () => post<{ success: boolean }>(api.auth.logout),
  sendWelcome: (email: string, name?: string) => post<{ success: boolean; message: string }>(api.auth.sendWelcome, { email, name }),
};

// Players
export const playersClient = {
  list: () => get<unknown[]>(api.players.list),
  create: (payload: unknown) => post<unknown>(api.players.create, payload),
  get: (id: string) => get<unknown>(api.players.get(id)),
  update: (id: string, payload: unknown) => patch<unknown>(api.players.update(id), payload),
  delete: (id: string) => del<unknown>(api.players.delete(id)),
  events: (playerId: string) => get<unknown[]>(api.players.events(playerId)),
};

// Teams
export const teamsClient = {
  list: () => get<unknown[]>(api.teams.list),
  create: (payload: unknown) => post<unknown>(api.teams.create, payload),
  get: (id: string) => get<unknown>(api.teams.get(id)),
  update: (id: string, payload: unknown) => patch<unknown>(api.teams.update(id), payload),
  delete: (id: string) => del<unknown>(api.teams.delete(id)),
  stats: (teamId: string) => get<unknown>(api.teams.stats(teamId)),
  addPlayer: (teamId: string, payload: unknown) => post<unknown>(api.teams.addPlayer(teamId), payload),
  removePlayer: (teamId: string, playerId: string) => del<unknown>(api.teams.removePlayer(teamId, playerId)),
  updatePlayer: (teamId: string, playerId: string, payload: unknown) => patch<unknown>(api.teams.updatePlayer(teamId, playerId), payload),
};

// Matches
export const matchesClient = {
  list: () => get<unknown[]>(api.matches.list),
  create: (payload: unknown) => post<unknown>(api.matches.create, payload),
  get: (id: string) => get<unknown>(api.matches.get(id)),
  delete: (id: string) => del<unknown>(api.matches.delete(id)),
  events: (id: string) => get<unknown[]>(api.matches.events(id)),
  timeline: (id: string) => get<unknown[]>(api.matches.timeline(id)),
};

// Trainings
export const trainingsClient = {
  create: (payload: unknown) => post<unknown>(api.trainings.create, payload),
  byPlayer: (playerId: string) => get<unknown[]>(api.trainings.byPlayer(playerId)),
};

// Stats
export const statsClient = {
  overview: () => get<unknown>(api.stats.overview),
  topPlayers: (params?: { metric?: string; limit?: number }) => get<unknown[]>(api.stats.topPlayers, params),
  timeseries: (params?: { range?: string; granularity?: string }) => get<unknown>(api.stats.timeseries, params),
};

// Formations
export const formationsClient = {
  list: () => get<unknown[]>(api.formations.list),
  create: (payload: unknown) => post<unknown>(api.formations.create, payload),
  get: (id: string) => get<unknown>(api.formations.get(id)),
  update: (id: string, payload: unknown) => patch<unknown>(api.formations.update(id), payload),
  delete: (id: string) => del<unknown>(api.formations.delete(id)),
  getDefault: () => get<unknown>(api.formations.getDefault),
  setDefault: (id: string) => patch<unknown>(api.formations.setDefault(id)),
  addPosition: (id: string, payload: unknown) => post<unknown>(api.formations.addPosition(id), payload),
  updatePosition: (id: string, posId: string, payload: unknown) => patch<unknown>(api.formations.updatePosition(id, posId), payload),
  deletePosition: (id: string, posId: string) => del<unknown>(api.formations.deletePosition(id, posId)),
};

// Chat
export const chatClient = {
  sessions: {
    list: () => get<unknown[]>(api.chat.sessions),
    create: (payload: unknown) => post<unknown>(api.chat.sessions, payload),
    get: (id: string) => get<unknown>(api.chat.session(id)),
    update: (id: string, payload: unknown) => patch<unknown>(api.chat.session(id), payload),
    delete: (id: string) => del<unknown>(api.chat.session(id)),
  },
  messages: (sessionId: string, payload: unknown) => post<unknown>(api.chat.messages(sessionId), payload),
  analysis: {
    player: (playerId: string) => get<unknown>(api.chat.analysis.player(playerId)),
    team: (teamId: string) => get<unknown>(api.chat.analysis.team(teamId)),
    match: (matchId: string) => get<unknown>(api.chat.analysis.match(matchId)),
    trainingRec: (playerId: string) => get<unknown>(api.chat.analysis.trainingRec(playerId)),
  },
};


