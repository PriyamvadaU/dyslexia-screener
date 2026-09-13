import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const ChildContext = createContext(null);

export function ChildProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const [childrenList, setChildrenList] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [loading, setLoading] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [pendingChildData, setPendingChildData] = useState(null);

  const fetchChildren = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setChildrenList([]);
      setActiveChild(null);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getChildren();
      const list = res.children || [];
      setChildrenList(list);

      const savedChildId = localStorage.getItem('lexiscreen_active_child_id');
      const found = list.find(c => c.id === savedChildId) || list[0] || null;
      setActiveChild(found);
      if (found) {
        localStorage.setItem('lexiscreen_active_child_id', found.id);
      }
    } catch (err) {
      console.error('[ChildContext] Error fetching children:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const selectChild = (child) => {
    setActiveChild(child);
    if (child) {
      localStorage.setItem('lexiscreen_active_child_id', child.id);
    } else {
      localStorage.removeItem('lexiscreen_active_child_id');
    }
  };

  const createChildWithConsent = async (childPayload, signatureName) => {
    const payload = {
      ...childPayload,
      consentConfirmed: true,
      signatureName
    };
    const res = await api.createChild(payload);
    const created = res.child;
    if (created) {
      setChildrenList(prev => [...prev.filter(c => c.id !== created.id), created]);
      setActiveChild(created);
      localStorage.setItem('lexiscreen_active_child_id', created.id);
    }
    await fetchChildren();
    return created;
  };

  return (
    <ChildContext.Provider value={{
      childrenList,
      activeChild,
      selectChild,
      fetchChildren,
      loading,
      createChildWithConsent,
      consentModalOpen,
      setConsentModalOpen,
      pendingChildData,
      setPendingChildData
    }}>
      {children}
    </ChildContext.Provider>
  );
}

export function useChild() {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error('useChild must be used within a ChildProvider');
  return ctx;
}
