"use client"

import { useEffect, useState } from 'react';

export default function ClientTime() {
    const [clientTime, setClientTime] = useState('');
    const [clientDate, setClientDate] = useState('');

    useEffect(() => {
        const getClientTimeAndDate = () => {
            const now = new Date();

            // Get the time in the desired format
            const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
            const formattedTime = now.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric', hour12: true })

            // Get the date in the desired format
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            setClientTime(formattedTime);
            setClientDate(formattedDate);
        };

        getClientTimeAndDate();

        // Optional: Set an interval to update the time and date every second
        const intervalId = setInterval(getClientTimeAndDate, 1000);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold lg:text-7xl">{clientTime}</h1>
            <p className="text-lg font-medium text-sky-1 lg:text-2xl">{clientDate}</p>
        </div>
    );
}
