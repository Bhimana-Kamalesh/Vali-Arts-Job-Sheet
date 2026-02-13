import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export function useIdleTimeout() {
    const navigate = useNavigate();
    const timeoutRef = useRef<number | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    const logout = async () => {
        await supabase.auth.signOut();
        navigate('/');
        alert('You have been logged out due to inactivity.');
    };

    const resetTimer = () => {
        lastActivityRef.current = Date.now();

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
            logout();
        }, IDLE_TIMEOUT) as unknown as number;
    };

    useEffect(() => {
        // Activity events to monitor
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        // Initialize timer
        resetTimer();

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, []);
}
