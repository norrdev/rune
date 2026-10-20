import { describe, it, expect, vi } from 'vitest';
import ReactDOM from 'react-dom/client';

describe('main entrypoint', () => {
  it('initializes React root on element with id root', async () => {
    const rootDiv = document.createElement('div');
    rootDiv.id = 'root';
    document.body.appendChild(rootDiv);

    const renderMock = vi.fn();
    const createRootSpy = vi.spyOn(ReactDOM, 'createRoot').mockReturnValue({
      render: renderMock,
      unmount: vi.fn(),
    } as any);

    await import('./main');

    expect(createRootSpy).toHaveBeenCalledWith(rootDiv);
    expect(renderMock).toHaveBeenCalled();
  });
});

