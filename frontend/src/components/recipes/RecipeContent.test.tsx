import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { IngredientList } from './IngredientList'
import { RecipeNutrition } from './RecipeNutrition'
import { StepList } from './StepList'
import { formatRecipeDate } from '@/lib/formatters'
afterEach(cleanup)
describe('recipe cooking content', () => {
  it('hides missing nutrition and preserves real zero values without inventing missing metrics', () => {
    const { rerender, container } = render(<RecipeNutrition nutrition={null} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<RecipeNutrition nutrition={{}} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<RecipeNutrition nutrition={{ calories: 0, proteinGrams: 3 }} />)
    expect(screen.getByText('0 kcal')).toBeInTheDocument()
    expect(screen.queryByText('Carbohidratos')).not.toBeInTheDocument()
  })
  it('uses formatted ingredients once and resets checks when the recipe changes', () => {
    const ingredient = {
      id: 1,
      name: 'Tomate',
      formatted: '2 tomates, picados (opcional)',
      optional: true,
      preparationNotes: 'picados',
      isLinkedToProduct: false,
    }
    const { rerender } = render(<IngredientList key="first" ingredients={[ingredient]} />)
    expect(screen.getByText('2 tomates, picados (opcional)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('checkbox')).toBeChecked()
    rerender(<IngredientList key="second" ingredients={[ingredient]} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })
  it('sorts steps numerically, including step images', () => {
    render(
      <StepList
        steps={[
          { id: 2, stepNumber: 2, instruction: 'Mezclar', imageUrl: '/step.jpg' },
          { id: 1, stepNumber: 1, instruction: 'Lavar' },
        ]}
      />,
    )
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Lavar')
    expect(screen.getByAltText('Paso 2')).toHaveAttribute('loading', 'lazy')
  })
  it('formats the long Colombian date without a leading zero', () => {
    expect(formatRecipeDate('2020-06-05T12:00:00Z')).toBe('5 de junio de 2020')
  })
})
