const absoluteZero = {
	celsius: -273.15,
	fahrenheit: -459.67,
	kelvin: 0
};

const unitNames = {
	celsius: '°C',
	fahrenheit: '°F',
	kelvin: 'K'
};

const form = document.querySelector('#converter-form');
const temperatureInput = document.querySelector('#temperature-input');
const inputUnit = document.querySelector('#input-unit');
const inputError = document.querySelector('#input-error');
const resultSummary = document.querySelector('#result-summary');
const resultFields = {
	celsius: document.querySelector('#result-celsius'),
	fahrenheit: document.querySelector('#result-fahrenheit'),
	kelvin: document.querySelector('#result-kelvin')
};

const numberFormat = new Intl.NumberFormat(undefined, {
	maximumFractionDigits: 2
});

function clearResults(message = 'Your converted values will appear here.') {
	for (const result of Object.values(resultFields)) {
		result.textContent = '--';
	}

	document.querySelectorAll('.source-tag').forEach((tag) => {
		tag.hidden = true;
	});

	resultSummary.textContent = message;
}

function setError(message) {
	inputError.textContent = message;
	temperatureInput.setAttribute('aria-invalid', String(Boolean(message)));
}

function validateInput({ showEmptyError = false } = {}) {
	const rawValue = temperatureInput.value.trim();

	if (rawValue === '') {
		const message = showEmptyError ? 'Enter a temperature to convert.' : '';
		setError(message);
		return { valid: false, empty: true };
	}

	const numericPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
	if (!numericPattern.test(rawValue)) {
		setError('Enter a valid number, such as 21.5 or −4.');
		return { valid: false, empty: false };
	}

	const value = Number(rawValue);
	if (!Number.isFinite(value)) {
		setError('That number is too large to convert.');
		return { valid: false, empty: false };
	}

	const unit = inputUnit.value;
	if (value < absoluteZero[unit]) {
		setError(`Temperatures cannot be below absolute zero (${absoluteZero[unit]} ${unitNames[unit]}).`);
		return { valid: false, empty: false };
	}

	setError('');
	return { valid: true, value, unit };
}

function toCelsius(value, unit) {
	if (unit === 'fahrenheit') {
		return (value - 32) * 5 / 9;
	}

	if (unit === 'kelvin') {
		return value - 273.15;
	}

	return value;
}

function normalizeZero(value) {
	return Math.abs(value) < 0.0000001 ? 0 : value;
}

function formatTemperature(value) {
	return numberFormat.format(normalizeZero(value));
}

temperatureInput.addEventListener('input', () => {
	const validation = validateInput();
	clearResults(validation.valid ? 'Select convert to see every scale.' : '');
});

inputUnit.addEventListener('change', () => {
	const validation = validateInput();
	clearResults(validation.valid ? 'Select convert to see every scale.' : '');
});

form.addEventListener('submit', (event) => {
	event.preventDefault();
	const validation = validateInput({ showEmptyError: true });

	if (!validation.valid) {
		clearResults('Check the temperature input and try again.');
		temperatureInput.focus();
		return;
	}

	let celsius = toCelsius(validation.value, validation.unit);
	if (Math.abs(celsius + 273.15) < 0.0000001) {
		celsius = -273.15;
	}

	const converted = {
		celsius,
		fahrenheit: celsius * 9 / 5 + 32,
		kelvin: celsius + 273.15
	};

	for (const [unit, value] of Object.entries(converted)) {
		resultFields[unit].textContent = formatTemperature(value);
		document.querySelector(`[data-result="${unit}"] .source-tag`).hidden = unit !== validation.unit;
	}

	resultSummary.textContent = `${formatTemperature(validation.value)} ${unitNames[validation.unit]} converted`;
});

const cursorCircle = document.querySelector('.cursor-circle');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (cursorCircle && finePointer && !reducedMotion) {
	let cursorX = 0;
	let cursorY = 0;
	let targetX = 0;
	let targetY = 0;
	let animationFrame = 0;

	function moveCursorCircle() {
		cursorX += (targetX - cursorX) * 0.28;
		cursorY += (targetY - cursorY) * 0.28;
		cursorCircle.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;

		if (Math.abs(targetX - cursorX) > 0.5 || Math.abs(targetY - cursorY) > 0.5) {
			animationFrame = window.requestAnimationFrame(moveCursorCircle);
		} else {
			animationFrame = 0;
		}
	}

	window.addEventListener('pointermove', (event) => {
		targetX = event.clientX;
		targetY = event.clientY;
		cursorCircle.classList.add('is-visible');

		if (!animationFrame) {
			animationFrame = window.requestAnimationFrame(moveCursorCircle);
		}
	}, { passive: true });

	document.addEventListener('pointerover', (event) => {
		cursorCircle.classList.toggle('is-active', Boolean(event.target.closest('a, button, input, select')));
	});

	window.addEventListener('pointerleave', () => {
		cursorCircle.classList.remove('is-visible', 'is-active');
	});
}
