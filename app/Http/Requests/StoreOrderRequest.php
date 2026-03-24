<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'table_number' => ['required', 'string', 'max:20'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
            'total' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'printer_ids' => ['nullable', 'array'],
            'printer_ids.*' => ['integer', 'exists:printers,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'table_number.required' => 'O número da mesa é obrigatório.',
            'items.required' => 'É necessário informar ao menos um item.',
            'items.min' => 'É necessário informar ao menos um item.',
            'items.*.name.required' => 'O nome do item é obrigatório.',
            'items.*.quantity.required' => 'A quantidade do item é obrigatória.',
            'items.*.quantity.min' => 'A quantidade mínima é 1.',
            'items.*.price.required' => 'O preço do item é obrigatório.',
        ];
    }
}
