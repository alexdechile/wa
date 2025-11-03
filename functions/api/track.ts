// File: functions/api/track.ts

interface TrackPayload {
  button: 'store' | 'support' | 'sales' | 'email';
  isHumanHours: boolean;
}

// This is a Cloudflare Pages function that handles POST requests
export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const payload = await request.json<TrackPayload>();
    
    // In a real application, you would save this data to a database (like Cloudflare D1)
    // or an analytics service. For now, we'll just log it on the server side.
    console.log('Received tracking data:', {
      timestamp: new Date().toISOString(),
      ...payload,
      // You can add more context from the request, e.g., location, user agent
      country: request.cf?.country,
      userAgent: request.headers.get('user-agent'),
    });

    return new Response(JSON.stringify({ success: true, message: 'Tracked successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing tracking request:', error);
    return new Response(JSON.stringify({ success: false, message: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};