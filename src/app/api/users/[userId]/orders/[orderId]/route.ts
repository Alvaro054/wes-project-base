import { Types } from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import {
  ErrorResponse,
  PopulatedOrder,
  getOrder,
} from '@/lib/handlers'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string; orderId: string } }
): Promise<NextResponse<PopulatedOrder> | NextResponse<ErrorResponse>> {
  if (!Types.ObjectId.isValid(params.userId)) {
    return NextResponse.json(
      {
        error: 'WRONG_PARAMS',
        message: 'Invalid user ID.',
      },
      { status: 400 }
    )
  }

  if (!Types.ObjectId.isValid(params.orderId)) {
    return NextResponse.json(
      {
        error: 'WRONG_PARAMS',
        message: 'Invalid order ID.',
      },
      { status: 400 }
    )
  }

  const order = await getOrder(params.userId, params.orderId)

  if (order === null) {
    return NextResponse.json(
      {
        error: 'NOT_FOUND',
        message: 'User or order not found.',
      },
      { status: 404 }
    )
  }

  return NextResponse.json(order)
}