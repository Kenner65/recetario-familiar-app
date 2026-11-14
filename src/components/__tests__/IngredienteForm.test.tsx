import { fireEvent, render } from '@testing-library/react-native';

import { IngredienteForm } from '../IngredienteForm';
import type { Ingrediente } from '../../types/receta';

const filaA: Ingrediente = { nombre: 'arroz', cantidad: 200, unidad: 'g' };
const filaB: Ingrediente = { nombre: 'agua', cantidad: 500, unidad: 'ml' };

describe('IngredienteForm', () => {
  it('agrega una fila de ingrediente', async () => {
    const onChange = jest.fn();
    const vista = await render(<IngredienteForm ingredientes={[filaA]} onChange={onChange} />);

    await fireEvent.press(vista.getByTestId('agregar-ingrediente'));

    expect(onChange).toHaveBeenCalledWith([filaA, { nombre: '', cantidad: 1, unidad: 'g' }]);
  });

  it('quita una fila de ingrediente', async () => {
    const onChange = jest.fn();
    const vista = await render(<IngredienteForm ingredientes={[filaA, filaB]} onChange={onChange} />);

    await fireEvent.press(vista.getByTestId('quitar-ingrediente-0'));

    expect(onChange).toHaveBeenCalledWith([filaB]);
  });
});
