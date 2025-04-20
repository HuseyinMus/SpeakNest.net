import axios from 'axios';
import { getToken } from './AuthService';

interface ZoomMeetingOptions {
  title: string;
  description?: string;
  startTime: string;
  duration: number;
  timezone?: string;
  password?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    waiting_room?: boolean;
    auto_recording?: 'local' | 'cloud' | 'none';
  };
}

interface ZoomMeetingResponse {
  id: string;
  join_url: string;
  start_url: string;
  password?: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    join_before_host: boolean;
    mute_upon_entry: boolean;
    waiting_room: boolean;
    auto_recording: string;
  };
}

interface ZoomError {
  code: string;
  message: string;
  details?: any;
}

class ZoomService {
  private static instance: ZoomService;
  private baseUrl = 'https://api.zoom.us/v2';
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): ZoomService {
    if (!ZoomService.instance) {
      ZoomService.instance = new ZoomService();
    }
    return ZoomService.instance;
  }

  private async getHeaders() {
    if (!this.token) {
      this.token = await getToken();
    }
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  private handleError(error: any): ZoomError {
    if (axios.isAxiosError(error)) {
      const response = error.response;
      if (response) {
        return {
          code: response.data.code || 'UNKNOWN_ERROR',
          message: response.data.message || 'Bilinmeyen bir hata oluştu',
          details: response.data,
        };
      }
    }
    return {
      code: 'NETWORK_ERROR',
      message: 'Ağ hatası oluştu',
      details: error,
    };
  }

  public async createMeeting(options: ZoomMeetingOptions): Promise<ZoomMeetingResponse> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/users/me/meetings`,
        {
          topic: options.title,
          type: 2, // Scheduled meeting
          start_time: options.startTime,
          duration: options.duration,
          timezone: options.timezone || 'Europe/Istanbul',
          password: options.password,
          settings: {
            host_video: options.settings?.host_video ?? true,
            participant_video: options.settings?.participant_video ?? true,
            join_before_host: options.settings?.join_before_host ?? false,
            mute_upon_entry: options.settings?.mute_upon_entry ?? false,
            waiting_room: options.settings?.waiting_room ?? true,
            auto_recording: options.settings?.auto_recording ?? 'none',
          },
        },
        { headers }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async getMeeting(meetingId: string): Promise<ZoomMeetingResponse> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.baseUrl}/meetings/${meetingId}`,
        { headers }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async updateMeeting(meetingId: string, options: Partial<ZoomMeetingOptions>): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await axios.patch(
        `${this.baseUrl}/meetings/${meetingId}`,
        {
          topic: options.title,
          start_time: options.startTime,
          duration: options.duration,
          timezone: options.timezone,
          settings: options.settings,
        },
        { headers }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async deleteMeeting(meetingId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      await axios.delete(
        `${this.baseUrl}/meetings/${meetingId}`,
        { headers }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async getMeetingParticipants(meetingId: string): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.baseUrl}/meetings/${meetingId}/registrants`,
        { headers }
      );

      return response.data.registrants || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export const zoomService = ZoomService.getInstance(); 