<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivity;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\Customer;
use App\Services\AI\OpenAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Throwable;

class ChatController extends Controller
{
    protected OpenAIService $ai;

    public function __construct(OpenAIService $ai)
    {
        $this->ai = $ai;
    }
    public function index(Request $request)
    {
        $query = Chat::with('customer')
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('search'), function ($q, $search) {
                $q->whereHas('customer', function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('external_id', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('last_message_at')
            ->orderByDesc('id');

        return response()->json($query->paginate(20));
    }

    public function show(Chat $chat)
    {
        $chat->load(['customer', 'messages' => function ($q) {
            $q->orderBy('sent_at');
        }]);

        return response()->json($chat);
    }

    public function sendMessage(Request $request, Chat $chat)
    {
        $data = $request->validate([
            'body' => 'required|string|max:5000',
            'as_customer' => 'boolean',
        ]);

        $admin = Auth::guard('admin')->user();

        $message = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => $data['as_customer'] ?? false ? 'customer' : 'admin',
            'sender_id' => $data['as_customer'] ?? false ? $chat->customer_id : optional($admin)->id,
            'body' => $data['body'],
            'impersonated' => $data['as_customer'] ?? false,
            'sent_at' => now(),
        ]);

        $lastMessage = $message;

        if ($data['as_customer'] ?? false) {
            try {
                $questionCount = ChatMessage::where('chat_id', $chat->id)
                    ->where('sender_type', 'admin')
                    ->where('impersonated', false)
                    ->count();

                $history = ChatMessage::where('chat_id', $chat->id)
                    ->orderBy('sent_at')
                    ->get(['sender_type', 'body'])
                    ->map(function (ChatMessage $m) {
                        return [
                            'role' => $m->sender_type === 'customer' ? 'user' : 'assistant',
                            'content' => $m->body,
                        ];
                    })
                    ->values()
                    ->all();

                $aiBody = $this->ai->generate($message->body, [
                    'chat_id' => $chat->id,
                    'customer_id' => $chat->customer_id,
                    'question_count' => $questionCount,
                    'history' => $history,
                ]);

                $aiMessage = ChatMessage::create([
                    'chat_id' => $chat->id,
                    'sender_type' => 'admin',
                    'sender_id' => optional($admin)->id,
                    'body' => $aiBody,
                    'impersonated' => false,
                    'sent_at' => now(),
                ]);

                $lastMessage = $aiMessage;
            } catch (Throwable $e) {
            }
        }

        $chat->update([
            'last_message_at' => $lastMessage->sent_at,
            'last_message_preview' => mb_substr($lastMessage->body, 0, 200),
        ]);

        if ($admin) {
            AdminActivity::create([
                'admin_id' => $admin->id,
                'action' => $data['as_customer'] ?? false ? 'chat_impersonate_send' : 'chat_admin_send',
                'resource_type' => Chat::class,
                'resource_id' => $chat->id,
                'meta' => [
                    'length' => mb_strlen($message->body),
                ],
            ]);
        }

        return response()->json($message->fresh(), 201);
    }

    public function createOrAttach(Request $request)
    {
        $data = $request->validate([
            'external_id' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'name' => 'nullable|string|max:255',
        ]);

        $customer = Customer::firstOrCreate(
            [
                'external_id' => $data['external_id'] ?? null,
                'email' => $data['email'] ?? null,
            ],
            ['name' => $data['name'] ?? null]
        );

        $chat = Chat::create([
            'customer_id' => $customer->id,
            'status' => 'open',
        ]);

        return response()->json($chat->load('customer'), 201);
    }
}
