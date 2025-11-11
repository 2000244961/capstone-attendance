import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {

  const [user, setUserState] = useState(() => {
    // Always try to load from localStorage on first render
    let stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  // On mount, reload user from localStorage if user is null
  useEffect(() => {
    if (!user) {
      let stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          setUserState(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  // When user changes, update only localStorage
  const setUser = (u) => {
    setUserState(u);
    if (u) {
      localStorage.setItem('currentUser', JSON.stringify(u));
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
