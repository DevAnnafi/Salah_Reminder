const API_BASE_URL = 'https://api.aladhan.com/v1';

function getTodayFormatted() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
}

async function getPrayerTimesByCity(city, country, method) {
    const date = getTodayFormatted();
    const url = `${API_BASE_URL}/timingsByCity/${date}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("HTTP error! status: ${response.status}");
        }

        const data = await response.json();

        if (data.code === 200) {
            return data.data;
        }
        else {
             throw new Error(`API error: ${data.status || 'Unknown error'}`);
        }




    } catch(error) {
        console.error('Error fetching prayer times:', error);
        throw error;

    }
};

async function getPrayerTimesByCoordinates(latitude, longitude, method) {
    const date = getTodayFormatted();
    const url = `${API_BASE_URL}/timings/${date}?latitude=${lat}&longitude=${lon}&method=${method}`

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("HTTP error! status: ${response.status}");
        }

        const data = await response.json();

        if (data.code === 200) {
            return data.data;
        }
        else {
            throw new Error(`API error: $(data.status || 'Unknown error'});`)
        }

    } catch(error) {
        console.error('Error fetching prayer times: ', error);
        throw error;
    }

};

function extractPrayerTimes(apiData) {
    if (!apiData) {
        throw new Error('Invalid API data: apiData is missing');
    }
    
    if (!apiData.timings) {
        throw new Error('Invalid API data: timings property is missing');
    }

    return {
        Fajr: apiData.timings.Fajr,
        Dhuhr: apiData.timings.Dhuhr,
        Asr: apiData.timings.Asr,
        Maghrib: apiData.timings.Maghrib,
        Isha: apiData.timings.Isha
    }

};

function extractDateInfo(apiData) {
    if (!apiData) {
        throw new Error('Invalid API data: apiData is missing');
    }

    if (!apiData.date) {
        throw new Error("Invalid API data: date property is missing");
    }

    return {
        gregorian: {
            date: apiData.date.gregorian.date,
            day: apiData.date.gregorian.day,
            weekday: apiData.date.gregorian.weekday,
            month: apiData.date.gregorian.month,
            year: apiData.date.gregorian.year
       },

       hijri: {
        date: apiData.date.hijri.date,
        day: apiData.date.hijri.day,
        weekday: apiData.date.hijri.weekday,
        month: apiData.date.hijri.month,
        year: apiData.date.hijri.year
      }
    }
}

function parseLocation(locationInput) {
    if (!locationInput) {
        throw new Error("Invalid Location: Enter a Location")
    }

    const trimmed_input = locationInput.trim();

    if (trimmed_input === '') {
        throw new Error ("Location cannot be empty");
    }

    if (trimmed_input.includes(",")) {
       const parts = trimmed_input.split(",");
       const trimmedParts = trimmed_input.trim();
       const city = trimmedParts[0];
       const country = trimmedParts[trimmedParts.length - 1];
       return { city: city, country: country};
        

    }

    else {
        return {city: locationInput, country: "US"};
    }
}






