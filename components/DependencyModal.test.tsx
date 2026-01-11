import { render, screen } from '@testing-library/react';
import DependencyModal from './DependencyModal';

describe('DependencyModal', () => {
  it('renders the modal when show is true', () => {
    render(<DependencyModal show={true} onClose={() => {}} onAddDependency={() => {}} />);
    expect(screen.getByText('Add Dependency')).toBeInTheDocument();
  });

  it('does not render the modal when show is false', () => {
    render(<DependencyModal show={false} onClose={() => {}} onAddDependency={() => {}} />);
    expect(screen.queryByText('Add Dependency')).not.toBeInTheDocument();
  });
});
