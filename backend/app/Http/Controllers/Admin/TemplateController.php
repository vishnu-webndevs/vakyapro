<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TemplateController extends Controller
{
    public function index()
    {
        return response()->json(DB::table('templates')->where('is_active', true)->get());
    }

    public function store(Request $request)
    {
        // TODO: Store template
    }

    public function update(Request $request, $id)
    {
        // TODO: Update template
    }

    public function destroy($id)
    {
        // TODO: Soft delete template
    }
}
