"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeeting = exports.createMeeting = exports.zoomToken = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const node_fetch_1 = __importDefault(require("node-fetch"));
admin.initializeApp();
// Token endpoint
exports.zoomToken = functions.https.onRequest(async (req, res) => {
    try {
        const tokenResponse = await (0, node_fetch_1.default)('https://zoom.us/oauth/token', {
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
    }
    catch (error) {
        console.error('Token alma hatası:', error);
        res.status(500).json({ error: 'Token alınamadı' });
    }
});
// Toplantı oluşturma endpoint'i
exports.createMeeting = functions.https.onRequest(async (req, res) => {
    try {
        const { title, description, startTime, duration } = req.body;
        // Token al
        const tokenResponse = await (0, node_fetch_1.default)('https://zoom.us/oauth/token', {
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
        const meetingResponse = await (0, node_fetch_1.default)('https://api.zoom.us/v2/users/me/meetings', {
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
    }
    catch (error) {
        console.error('Toplantı oluşturma hatası:', error);
        res.status(500).json({ error: 'Toplantı oluşturulamadı' });
    }
});
// Toplantı detayları endpoint'i
exports.getMeeting = functions.https.onRequest(async (req, res) => {
    try {
        const meetingId = req.query.meetingId;
        // Token al
        const tokenResponse = await (0, node_fetch_1.default)('https://zoom.us/oauth/token', {
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
        const meetingResponse = await (0, node_fetch_1.default)(`https://api.zoom.us/v2/meetings/${meetingId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        const meetingData = await meetingResponse.json();
        res.json(meetingData);
    }
    catch (error) {
        console.error('Toplantı bilgileri alma hatası:', error);
        res.status(500).json({ error: 'Toplantı bilgileri alınamadı' });
    }
});
//# sourceMappingURL=index.js.map