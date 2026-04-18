/**
 * ESLint flat config для mobile приложения.
 *
 * Правила:
 * 1. Запрет прямого импорта View, Text, TouchableOpacity из 'react-native'
 *    → Использовать Box/DSText из '@/design-system' или '@/components/ui'
 * 2. Исключение: файлы внутри design-system/ и components/ui/ — им разрешён прямой импорт.
 */
export default [
	{
		files: ['src/**/*.ts', 'src/**/*.tsx'],
		ignores: [
			'src/design-system/**',
			'src/components/ui/**',
		],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'react-native',
							importNames: [
								'View',
								'Text',
								'TouchableOpacity',
								'TouchableHighlight',
								'TouchableWithoutFeedback',
							],
							message:
								'Используй Box/DSText из "@/design-system" или компоненты из "@/components/ui". Прямой импорт View/Text/TouchableOpacity запрещён.',
						},
					],
				},
			],
		},
	},
]
