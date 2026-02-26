@props(['disabled' => false])

<input @disabled($disabled) {{ $attributes->merge(['class' => 'border-purple-100 focus:border-purple-300 focus:ring-purple-300 rounded-xl shadow-sm']) }}>