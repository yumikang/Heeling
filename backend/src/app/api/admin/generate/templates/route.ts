import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';

interface Template {
  id: string;
  name: string;
  type: 'title' | 'lyrics' | 'image' | 'suno';
  content: string;
  createdAt: string;
}

// GET: Load all templates
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_templates' },
    });

    const templates: Template[] = (setting?.value as unknown as Template[]) || [];

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Load templates error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load templates' },
      { status: 500 }
    );
  }
}

// POST: Create new template
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, content } = body;

    if (!name || !type || !content) {
      return NextResponse.json(
        { success: false, error: 'Name, type, and content are required' },
        { status: 400 }
      );
    }

    // Get existing templates
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_templates' },
    });

    const templates: Template[] = (setting?.value as unknown as Template[]) || [];

    // Create new template
    const newTemplate: Template = {
      id: `template_${Date.now()}`,
      name,
      type,
      content,
      createdAt: new Date().toISOString(),
    };

    templates.push(newTemplate);

    // Save templates
    await prisma.systemSetting.upsert({
      where: { key: 'ai_templates' },
      update: { value: templates as any },
      create: { key: 'ai_templates', value: templates as any },
    });

    return NextResponse.json({
      success: true,
      data: newTemplate,
    });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 500 }
    );
  }
}

// PUT: Update template
export async function PUT(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, type, content } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Get existing templates
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_templates' },
    });

    const templates: Template[] = (setting?.value as unknown as Template[]) || [];
    const templateIndex = templates.findIndex(t => t.id === id);

    if (templateIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Update template
    templates[templateIndex] = {
      ...templates[templateIndex],
      ...(name && { name }),
      ...(type && { type }),
      ...(content && { content }),
    };

    // Save templates
    await prisma.systemSetting.upsert({
      where: { key: 'ai_templates' },
      update: { value: templates as any },
      create: { key: 'ai_templates', value: templates as any },
    });

    return NextResponse.json({
      success: true,
      data: templates[templateIndex],
    });
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE: Delete template
export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Get existing templates
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_templates' },
    });

    const templates: Template[] = (setting?.value as unknown as Template[]) || [];
    const filteredTemplates = templates.filter(t => t.id !== id);

    if (filteredTemplates.length === templates.length) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Save templates
    await prisma.systemSetting.upsert({
      where: { key: 'ai_templates' },
      update: { value: filteredTemplates as any },
      create: { key: 'ai_templates', value: filteredTemplates as any },
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete template' },
      { status: 500 }
    );
  }
}
