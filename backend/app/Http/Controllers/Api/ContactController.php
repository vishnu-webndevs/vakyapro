<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Throwable;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:8000'],
        ]);

        $record = ContactMessage::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'subject' => $data['subject'],
            'message' => $data['message'],
            'status' => 'new',
        ]);

        $appName = (string) config('app.name', 'VakyaPro');
        $fromAddress = (string) (config('mail.from.address') ?? '');
        $fromName = (string) (config('mail.from.name') ?? $appName);
        $adminEmail = (string) (env('CONTACT_NOTIFY_EMAIL', $fromAddress) ?? $fromAddress);

        // Prepare email bodies
        $userSubject = '['.$appName.'] We received your message';
        $userText = "Hi {$data['name']},\n\nThanks for contacting {$appName}. We have received your message:\n\nSubject: {$data['subject']}\n\n{$data['message']}\n\nWe will get back to you as soon as possible.\n\nRegards,\n{$appName} Support";
        $userHtml = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'
            .htmlspecialchars($userSubject, ENT_QUOTES, 'UTF-8')
            .'</title></head><body style="margin:0;background:#0b1220;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">'
            .'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-collapse:separate;border-spacing:0;">'
            .'<tr><td style="padding:0 0 12px 0;color:#cbd5e1;font-size:12px;">'
            .htmlspecialchars($appName, ENT_QUOTES, 'UTF-8')
            .'</td></tr>'
            .'<tr><td style="background:#0f172a;border:1px solid rgba(148,163,184,0.18);border-radius:16px;padding:24px;">'
            .'<div style="color:#e2e8f0;font-size:16px;font-weight:600;margin-bottom:4px">We received your message</div>'
            .'<div style="color:#94a3b8;font-size:13px;margin-bottom:16px">Thanks for contacting us. Here is a copy of your request.</div>'
            .'<div style="color:#e2e8f0;font-size:14px;margin-top:4px"><strong>Subject:</strong> '
            .htmlspecialchars($data['subject'], ENT_QUOTES, 'UTF-8')
            .'</div>'
            .'<div style="color:#94a3b8;font-size:13px;margin-top:8px;white-space:pre-wrap;">'
            .nl2br(htmlspecialchars($data['message'], ENT_QUOTES, 'UTF-8'))
            .'</div>'
            .'<div style="color:#64748b;font-size:12px;margin-top:16px">We will get back to you as soon as possible.</div>'
            .'</td></tr>'
            .'</table></body></html>';

        $adminSubject = '['.$appName.'] New contact message: '.$data['subject'];
        $adminText = "New contact message:\n\nName: {$data['name']}\nEmail: {$data['email']}\nSubject: {$data['subject']}\n\n{$data['message']}\n\nMessage ID: {$record->id}";
        $adminHtml = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'
            .htmlspecialchars($adminSubject, ENT_QUOTES, 'UTF-8')
            .'</title></head><body style="margin:0;background:#0b1220;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">'
            .'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-collapse:separate;border-spacing:0;">'
            .'<tr><td style="padding:0 0 12px 0;color:#cbd5e1;font-size:12px;">'
            .htmlspecialchars($appName, ENT_QUOTES, 'UTF-8')
            .'</td></tr>'
            .'<tr><td style="background:#0f172a;border:1px solid rgba(148,163,184,0.18);border-radius:16px;padding:24px;">'
            .'<div style="color:#e2e8f0;font-size:16px;font-weight:600;margin-bottom:8px">New contact message</div>'
            .'<div style="color:#94a3b8;font-size:13px;margin-bottom:8px">A new request was submitted from the website.</div>'
            .'<div style="color:#e2e8f0;font-size:14px;margin-top:4px"><strong>Name:</strong> '
            .htmlspecialchars($data['name'], ENT_QUOTES, 'UTF-8')
            .'</div>'
            .'<div style="color:#e2e8f0;font-size:14px;margin-top:4px"><strong>Email:</strong> '
            .htmlspecialchars($data['email'], ENT_QUOTES, 'UTF-8')
            .'</div>'
            .'<div style="color:#e2e8f0;font-size:14px;margin-top:4px"><strong>Subject:</strong> '
            .htmlspecialchars($data['subject'], ENT_QUOTES, 'UTF-8')
            .'</div>'
            .'<div style="color:#94a3b8;font-size:13px;margin-top:8px;white-space:pre-wrap;">'
            .nl2br(htmlspecialchars($data['message'], ENT_QUOTES, 'UTF-8'))
            .'</div>'
            .'<div style="color:#64748b;font-size:12px;margin-top:16px">Message ID: '
            .htmlspecialchars((string) $record->id, ENT_QUOTES, 'UTF-8')
            .'</div>'
            .'</td></tr>'
            .'</table></body></html>';

        try {
            // Send to user
            Mail::send([], [], function ($message) use ($data, $userSubject, $fromAddress, $fromName, $userHtml, $userText) {
                $message->to($data['email'], $data['name']);
                if ($fromAddress !== '') {
                    $message->from($fromAddress, $fromName);
                }
                $message->subject($userSubject)
                    ->text($userText)
                    ->html($userHtml);
            });

            // Send to admin
            if ($adminEmail !== '') {
                Mail::send([], [], function ($message) use ($adminEmail, $data, $adminSubject, $fromAddress, $fromName, $adminHtml, $adminText) {
                    $message->to($adminEmail);
                    if ($fromAddress !== '') {
                        $message->from($fromAddress, $fromName);
                    }
                    $message->replyTo($data['email'], $data['name']);
                    $message->subject($adminSubject)
                        ->text($adminText)
                        ->html($adminHtml);
                });
            }
        } catch (Throwable $e) {
            // Still return success for the user, but include info
        }

        return response()->json([
            'id' => $record->id,
            'message' => 'Thank you! Your message has been sent.',
        ], 201);
    }
}
