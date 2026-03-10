// frontend/src/hooks/useData.js
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../lib/api";

export function useData() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [summary, setSummary]         = useState(null);
  const [feed, setFeed]               = useState([]);
  const [heatmaps, setHeatmaps]       = useState({});
  const [weeklies, setWeeklies]       = useState({});
  const [syncing, setSyncing]         = useState(false);
  const [lastSync, setLastSync]       = useState(null);
  const [error, setError]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const pollRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [lb, sum, fd] = await Promise.all([
        api.getLeaderboard(),
        api.getSummary(),
        api.getFeed(),
      ]);
      setLeaderboard(lb);
      setSummary(sum);
      setFeed(fd);
      setError(null);

      // Fetch heatmaps + weeklies for each user
      const hm = {}, wk = {};
      await Promise.all(
        lb.map(async (u) => {
          try {
            const [h, w] = await Promise.all([
              api.getHeatmap(u.id),
              api.getWeekly(u.id),
            ]);
            hm[u.id] = h;
            wk[u.id] = w.map((d) => d.count);
          } catch (_) {}
        })
      );
      setHeatmaps(hm);
      setWeeklies(wk);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Poll every 30 seconds for live-ish updates
    pollRef.current = setInterval(fetchAll, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchAll]);

  const triggerSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await api.triggerSync();
      setLastSync(new Date().toISOString());
      // Re-fetch after 3 s to let sync complete
      setTimeout(fetchAll, 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setTimeout(() => setSyncing(false), 2000);
    }
  }, [syncing, fetchAll]);

  return {
    leaderboard, summary, feed, heatmaps, weeklies,
    syncing, lastSync, error, loading,
    refetch: fetchAll, triggerSync,
  };
}
