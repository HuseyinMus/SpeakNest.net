import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch, { Response } from 'node-fetch';

admin.initializeApp();

// Token endpoint
export const zoomToken = functions.https.onRequest(async (req, res) => {
  try {
    const tokenResponse: Response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: process.env.ZOOM_ACCOUNT_ID || '',
        client_id: process.env.ZOOM_CLIENT_ID || '',
        client_secret: process.env.ZOOM_CLIENT_SECRET || '',
      }),
    });

    const tokenData = await tokenResponse.json();
    res.json(tokenData);
  } catch (error) {
    console.error('Token alma hatası:', error);
    res.status(500).json({ error: 'Token alınamadı' });
  }
});

// Toplantı oluşturma endpoint'i
export const createMeeting = functions.https.onRequest(async (req, res) => {
  try {
    const { title, description, startTime, duration } = req.body;

    // Token al
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: process.env.ZOOM_ACCOUNT_ID || '',
        client_id: process.env.ZOOM_CLIENT_ID || '',
        client_secret: process.env.ZOOM_CLIENT_SECRET || '',
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Toplantı oluştur
    const meetingResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: title,
        type: 2,
        start_time: new Date(startTime).toISOString(),
        duration: duration || 60,
        timezone: 'Europe/Istanbul',
        agenda: description,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: false,
          waiting_room: false,
          auto_recording: 'none',
        },
      }),
    });

    const meetingData = await meetingResponse.json();
    res.json({
      joinUrl: meetingData.join_url,
      meetingId: meetingData.id,
    });
  } catch (error) {
    console.error('Toplantı oluşturma hatası:', error);
    res.status(500).json({ error: 'Toplantı oluşturulamadı' });
  }
});

// Toplantı detayları endpoint'i
export const getMeeting = functions.https.onRequest(async (req, res) => {
  try {
    const meetingId = req.query.meetingId;

    // Token al
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: process.env.ZOOM_ACCOUNT_ID || '',
        client_id: process.env.ZOOM_CLIENT_ID || '',
        client_secret: process.env.ZOOM_CLIENT_SECRET || '',
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Toplantı bilgilerini al
    const meetingResponse = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const meetingData = await meetingResponse.json();
    res.json(meetingData);
  } catch (error) {
    console.error('Toplantı bilgileri alma hatası:', error);
    res.status(500).json({ error: 'Toplantı bilgileri alınamadı' });
  }
}); 