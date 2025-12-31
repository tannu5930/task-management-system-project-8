import React from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';

const SortableTaskCard = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandleProps = {
    ...attributes,
    ...listeners,
    style: { cursor: 'grab' },
    onClick: (e) => e.stopPropagation(),
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        className="absolute top-0 left-0 w-full h-8 z-10 cursor-grab"
        {...dragHandleProps}
      />
      <TaskCard
        task={task}
        onUpdate={onStatusChange}
        onSelect={() => {}}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />
    </div>
  );
};

const KanbanColumn = ({
  id,
  title,
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const getColumnColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'border-yellow-300 bg-yellow-50';
      case 'In Progress':
        return 'border-blue-300 bg-blue-50';
      case 'Completed':
        return 'border-green-300 bg-green-50';
      default:
        return 'border-gray-300 bg-base-200';
    }
  };

  const getHeaderColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-base-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-80 max-w-sm mx-2 rounded-lg border-2 transition-colors ${
        isOver ? 'border-blue-500 bg-blue-50' : getColumnColor(title)
      }`}
    >
      <div className={`p-4 border-b-2 rounded-t-lg ${getHeaderColor(title)}`}>
        <h3 className="font-bold text-lg flex items-center justify-between">
          {title}
          <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full text-sm font-medium">
            {tasks.length}
          </span>
        </h3>
      </div>

      <div className="p-4 space-y-3 min-h-96">
        <SortableContext items={tasks.map(task => task._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task._id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">No Tasks</div>
            <p>No tasks in {title.toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanBoard = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [activeTask, setActiveTask] = React.useState(null);

  const tasksByStatus = React.useMemo(() => {
    return {
      'Pending': tasks.filter(task => task.taskStatus === 'Pending'),
      'In Progress': tasks.filter(task => task.taskStatus === 'In Progress'),
      'Completed': tasks.filter(task => task.taskStatus === 'Completed'),
    };
  }, [tasks]);

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t._id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    console.log('Drag end:', { active: active.id, over: over?.id });

    if (!over) {
      console.log('No over target');
      setActiveTask(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find(task => task._id === activeId);
    if (!activeTask) {
      console.log('Active task not found');
      setActiveTask(null);
      return;
    }

    console.log('Active task:', activeTask.taskStatus, 'Over ID:', overId);

    const columnStatuses = ['Pending', 'In Progress', 'Completed'];
    if (columnStatuses.includes(overId)) {
      const newStatus = overId;

      console.log('Dropping on column:', newStatus);
      if (activeTask.taskStatus !== newStatus) {
        console.log('Status changed from', activeTask.taskStatus, 'to', newStatus);
        const updatedTask = { ...activeTask, taskStatus: newStatus };
        onStatusChange(updatedTask);
      } else {
        console.log('Status unchanged');
      }
    } else {
      console.log('Not dropping on column, overId:', overId);
      const overTask = tasks.find(task => task._id === overId);
      if (!overTask || activeTask.taskStatus !== overTask.taskStatus) {
        console.log('Invalid drop target');
        setActiveTask(null);
        return;
      }

      console.log('Dropping on another task in same column');
    }

    setActiveTask(null);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find(task => task._id === activeId);
    if (!activeTask) return;

    const columnStatuses = ['Pending', 'In Progress', 'Completed'];

    if (columnStatuses.includes(overId)) {
      const newStatus = overId;

      if (activeTask.taskStatus !== newStatus) {
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex flex-wrap justify-center gap-4 p-4 overflow-x-auto min-h-screen">
        <KanbanColumn
          id="Pending"
          title="Pending"
          tasks={tasksByStatus.Pending}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
        <KanbanColumn
          id="In Progress"
          title="In Progress"
          tasks={tasksByStatus['In Progress']}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
        <KanbanColumn
          id="Completed"
          title="Completed"
          tasks={tasksByStatus.Completed}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-90">
            <TaskCard
              task={activeTask}
              onUpdate={() => {}}
              onSelect={() => {}}
              onDelete={() => {}}
              onStatusChange={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;